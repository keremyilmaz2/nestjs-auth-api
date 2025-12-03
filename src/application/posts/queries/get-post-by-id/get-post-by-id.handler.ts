import { Injectable, Inject } from '@nestjs/common';
import { GetPostByIdQuery } from './get-post-by-id.query';
import { Result } from '@application/common/result';
import { PostResponseDto } from '@application/posts/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class GetPostByIdHandler implements IUseCase<GetPostByIdQuery, Result<PostResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(query: GetPostByIdQuery): Promise<Result<PostResponseDto>> {
    try {
      const post = await this.unitOfWork.postRepository.findById(query.postId);

      if (!post) {
        return Result.fail('Post not found', 'POST_NOT_FOUND');
      }

      return Result.ok({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        isPublished: post.isPublished,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });
    } catch (error) {
      return Result.fail('Failed to fetch post', 'FETCH_FAILED');
    }
  }
}
