import { Injectable, Inject } from '@nestjs/common';
import { GetPostsQuery } from './get-posts.query';
import { Result } from '@application/common/result';
import { PaginatedPostsResponseDto, PostResponseDto } from '@application/posts/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class GetPostsHandler implements IUseCase<GetPostsQuery, Result<PaginatedPostsResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(query: GetPostsQuery): Promise<Result<PaginatedPostsResponseDto>> {
    try {
      let paginatedResult;

      if (query.authorId) {
        paginatedResult = await this.unitOfWork.postRepository.findByAuthorIdPaginated(
          query.authorId,
          query.page,
          query.pageSize,
        );
      } else if (query.onlyPublished) {
        paginatedResult = await this.unitOfWork.postRepository.findPublishedPostsPaginated(
          query.page,
          query.pageSize,
        );
      } else {
        paginatedResult = await this.unitOfWork.postRepository.findAllPaginated(
          query.page,
          query.pageSize,
        );
      }

      const items: PostResponseDto[] = paginatedResult.items.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        isPublished: post.isPublished,
        publishedAt: post.publishedAt,
        images: post.images.map((img) => ({ // YENİ
          id: img.id,
          imageUrl: img.imageUrl,
          s3Key: img.s3Key,
          order: img.order,
          createdAt: img.createdAt,
        })),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));

      return Result.ok({
        items,
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        totalPages: paginatedResult.totalPages,
        hasNextPage: paginatedResult.hasNextPage,
        hasPreviousPage: paginatedResult.hasPreviousPage,
      });
    } catch (error) {
      return Result.fail('Failed to fetch posts', 'FETCH_FAILED');
    }
  }
}