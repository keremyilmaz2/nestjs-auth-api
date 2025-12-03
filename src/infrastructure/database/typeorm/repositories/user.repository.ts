import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BaseRepository } from './base.repository';
import { IUserRepository, PaginatedResult } from '@core/repositories';
import { User } from '@core/domain/entities/user.entity';
import { Role } from '@core/domain/enums/role.enum';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../../mappers/user.mapper';

@Injectable()
export class UserRepository
  extends BaseRepository<User, UserOrmEntity>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    repository: Repository<UserOrmEntity>,
    entityManager?: EntityManager,
  ) {
    super(repository, entityManager);
  }

  protected toDomain(orm: UserOrmEntity): User {
    return UserMapper.toDomain(orm);
  }

  protected toOrm(domain: User): UserOrmEntity {
    return UserMapper.toOrm(domain);
  }

  protected getId(domain: User): string {
    return domain.id;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { username },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { refreshToken },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRole(role: Role): Promise<User[]> {
    const entities = await this.repository.find({
      where: { role },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveUsers(): Promise<User[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveUsersPaginated(page: number, pageSize: number): Promise<PaginatedResult<User>> {
    const skip = (page - 1) * pageSize;
    const [entities, total] = await this.repository.findAndCount({
      where: { isActive: true },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { username },
    });
    return count > 0;
  }

  /**
   * Create a new instance of this repository with a specific entity manager
   * Used for transaction support
   */
  withEntityManager(manager: EntityManager): UserRepository {
    return new UserRepository(
      manager.getRepository(UserOrmEntity),
      manager,
    );
  }
}
