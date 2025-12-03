import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Like } from 'typeorm';
import { BaseRepository } from './base.repository';
import { IPostRepository, PaginatedResult } from '@core/repositories';
import { Post } from '@core/domain/entities/post.entity';
import { PostOrmEntity } from '../entities/post.orm-entity';
import { PostMapper } from '../../mappers/post.mapper';

@Injectable()
export class PostRepository
  extends BaseRepository<Post, PostOrmEntity>
  implements IPostRepository
{
  constructor(
    @InjectRepository(PostOrmEntity)
    repository: Repository<PostOrmEntity>,
    entityManager?: EntityManager,
  ) {
    super(repository, entityManager);
  }

  protected toDomain(orm: PostOrmEntity): Post {
    return PostMapper.toDomain(orm);
  }

  protected toOrm(domain: Post): PostOrmEntity {
    return PostMapper.toOrm(domain);
  }

  protected getId(domain: Post): string {
    return domain.id;
  }

  async findByAuthorId(authorId: string): Promise<Post[]> {
    const entities = await this.repository.find({
      where: { authorId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByAuthorIdPaginated(
    authorId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * pageSize;
    const [entities, total] = await this.repository.findAndCount({
      where: { authorId },
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

  async findPublishedPosts(): Promise<Post[]> {
    const entities = await this.repository.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findPublishedPostsPaginated(
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Post>> {
    const skip = (page - 1) * pageSize;
    const [entities, total] = await this.repository.findAndCount({
      where: { isPublished: true },
      skip,
      take: pageSize,
      order: { publishedAt: 'DESC' },
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

  async findByTitle(title: string): Promise<Post[]> {
    const entities = await this.repository.find({
      where: { title: Like(`%${title}%`) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async searchByContent(keyword: string): Promise<Post[]> {
    const entities = await this.repository.find({
      where: { content: Like(`%${keyword}%`) },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Create a new instance of this repository with a specific entity manager
   * Used for transaction support
   */
  withEntityManager(manager: EntityManager): PostRepository {
    return new PostRepository(
      manager.getRepository(PostOrmEntity),
      manager,
    );
  }
}
