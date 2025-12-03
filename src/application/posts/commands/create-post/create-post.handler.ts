import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostCommand } from './create-post.command';
import { Result } from '@application/common/result';
import { PostResponseDto } from '@application/posts/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { Post } from '@core/domain/entities';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class CreatePostHandler implements IUseCase<CreatePostCommand, Result<PostResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: CreatePostCommand): Promise<Result<PostResponseDto>> {
    // Verify author exists
    const author = await this.unitOfWork.userRepository.findById(command.authorId);
    if (!author) {
      return Result.fail('Author not found', 'AUTHOR_NOT_FOUND');
    }

    // Create post entity
    const postId = uuidv4();
    const post = Post.createNew(
      postId,
      command.title,
      command.content,
      command.authorId,
    );

    // Publish if requested
    if (command.isPublished) {
      post.publish();
    }

    try {
      await this.unitOfWork.executeInTransaction(async () => {
        await this.unitOfWork.postRepository.create(post);
      });
    } catch (error) {
      return Result.fail('Failed to create post', 'CREATE_FAILED');
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
  }
}
