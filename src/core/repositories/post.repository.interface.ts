import { Post } from '../domain/entities/post.entity';
import { IBaseRepository, PaginatedResult } from './base.repository.interface';

export interface IPostRepository extends IBaseRepository<Post> {
  findByAuthorId(authorId: string): Promise<Post[]>;
  findByAuthorIdPaginated(authorId: string, page: number, pageSize: number): Promise<PaginatedResult<Post>>;
  findPublishedPosts(): Promise<Post[]>;
  findPublishedPostsPaginated(page: number, pageSize: number): Promise<PaginatedResult<Post>>;
  findByTitle(title: string): Promise<Post[]>;
  searchByContent(keyword: string): Promise<Post[]>;
}

export const POST_REPOSITORY = Symbol('IPostRepository');
