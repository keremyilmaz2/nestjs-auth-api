import { Injectable, Inject } from '@nestjs/common';
import { DeleteUserCommand } from './delete-user.command';
import { Result } from '@application/common/result';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class DeleteUserHandler implements IUseCase<DeleteUserCommand, Result<void>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: DeleteUserCommand): Promise<Result<void>> {
    // Find user to delete
    const user = await this.unitOfWork.userRepository.findById(command.userId);
    if (!user) {
      return Result.fail('User not found', 'USER_NOT_FOUND');
    }

    // Prevent self-deletion
    if (command.userId === command.requesterId) {
      return Result.fail('Cannot delete your own account', 'SELF_DELETE_FORBIDDEN');
    }

    try {
      await this.unitOfWork.executeInTransaction(async () => {
        // Delete all posts by this user first
        const posts = await this.unitOfWork.postRepository.findByAuthorId(command.userId);
        for (const post of posts) {
          await this.unitOfWork.postRepository.delete(post.id);
        }
        // Then delete the user
        await this.unitOfWork.userRepository.delete(command.userId);
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail('Failed to delete user', 'DELETE_FAILED');
    }
  }
}
