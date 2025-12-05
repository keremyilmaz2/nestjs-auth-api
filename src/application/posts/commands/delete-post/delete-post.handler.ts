import { Injectable, Inject } from '@nestjs/common';
import { DeletePostCommand } from './delete-post.command';
import { Result } from '@application/common/result';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { Role, hasMinimumRole } from '@core/domain/enums/role.enum';
import { S3Service } from '@infrastructure/services/s3.service'; // YENİ

@Injectable()
export class DeletePostHandler implements IUseCase<DeletePostCommand, Result<void>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly s3Service: S3Service, // YENİ
  ) {}

  async execute(command: DeletePostCommand): Promise<Result<void>> {
    // Find post
    const post = await this.unitOfWork.postRepository.findById(command.postId);
    if (!post) {
      return Result.fail('Post not found', 'POST_NOT_FOUND');
    }

    // Authorization: Moderator+ can delete any post
    const isModerator = hasMinimumRole(command.requesterRole as Role, Role.MODERATOR);

    if (!isModerator) {
      return Result.fail('Only moderators can delete posts', 'FORBIDDEN');
    }

    try {
      // Delete images from S3 first
      if (post.images && post.images.length > 0) {
        const s3Keys = post.images.map((img) => img.s3Key);
        try {
          await this.s3Service.deleteMultipleFiles(s3Keys);
        } catch (error) {
          // Log error but continue with post deletion
          console.error('Failed to delete S3 files:', error);
        }
      }

      // Delete post from database
      await this.unitOfWork.executeInTransaction(async () => {
        await this.unitOfWork.postRepository.delete(command.postId);
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail('Failed to delete post', 'DELETE_FAILED');
    }
  }
}