import { Injectable, Inject } from '@nestjs/common';
import { UpdatePostCommand } from './update-post.command';
import { Result } from '@application/common/result';
import { PostResponseDto } from '@application/posts/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { Role, hasMinimumRole } from '@core/domain/enums/role.enum';

@Injectable()
export class UpdatePostHandler implements IUseCase<UpdatePostCommand, Result<PostResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: UpdatePostCommand): Promise<Result<PostResponseDto>> {
    // Find post
    const post = await this.unitOfWork.postRepository.findById(command.postId);
    if (!post) {
      return Result.fail('Post not found', 'POST_NOT_FOUND');
    }

    // Check authorization: owner or moderator+
    const isOwner = post.isOwnedBy(command.requesterId);
    const isModerator = hasMinimumRole(command.requesterRole as Role, Role.MODERATOR);

    if (!isOwner && !isModerator) {
      return Result.fail('Not authorized to update this post', 'FORBIDDEN');
    }

    // Update fields
    if (command.title !== undefined) {
      post.updateTitle(command.title);
    }

    if (command.content !== undefined) {
      post.updateContent(command.content);
    }

    if (command.isPublished !== undefined) {
      if (command.isPublished) {
        post.publish();
      } else {
        post.unpublish();
      }
    }

    try {
      await this.unitOfWork.executeInTransaction(async () => {
        await this.unitOfWork.postRepository.update(post);
      });
    } catch (error) {
      return Result.fail('Failed to update post', 'UPDATE_FAILED');
    }

    return Result.ok({
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
    });
  }
}