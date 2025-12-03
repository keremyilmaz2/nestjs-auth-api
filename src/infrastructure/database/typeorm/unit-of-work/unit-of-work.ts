import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { IUnitOfWork } from '@core/unit-of-work';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { IPostRepository } from '@core/repositories/post.repository.interface';
import { UserRepository } from '../repositories/user.repository';
import { PostRepository } from '../repositories/post.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { PostOrmEntity } from '../entities/post.orm-entity';

@Injectable()
export class UnitOfWork implements IUnitOfWork {
  private queryRunner: QueryRunner | null = null;
  private _userRepository: UserRepository;
  private _postRepository: PostRepository;

  constructor(private readonly dataSource: DataSource) {
    // Initialize repositories with default entity manager
    this._userRepository = new UserRepository(
      this.dataSource.getRepository(UserOrmEntity),
    );
    this._postRepository = new PostRepository(
      this.dataSource.getRepository(PostOrmEntity),
    );
  }

  get userRepository(): IUserRepository {
    if (this.queryRunner) {
      return this._userRepository.withEntityManager(this.queryRunner.manager);
    }
    return this._userRepository;
  }

  get postRepository(): IPostRepository {
    if (this.queryRunner) {
      return this._postRepository.withEntityManager(this.queryRunner.manager);
    }
    return this._postRepository;
  }

  async beginTransaction(): Promise<void> {
    if (this.queryRunner) {
      throw new Error('Transaction already in progress');
    }
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction in progress');
    }
    try {
      await this.queryRunner.commitTransaction();
    } finally {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction in progress');
    }
    try {
      await this.queryRunner.rollbackTransaction();
    } finally {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  async executeInTransaction<T>(work: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await work();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
