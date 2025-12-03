import { Injectable, Inject } from '@nestjs/common';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { Result } from '@application/common/result';
import { UserResponseDto } from '@application/users/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class GetUserByIdHandler implements IUseCase<GetUserByIdQuery, Result<UserResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<Result<UserResponseDto>> {
    try {
      const user = await this.unitOfWork.userRepository.findById(query.userId);

      if (!user) {
        return Result.fail('User not found', 'USER_NOT_FOUND');
      }

      return Result.ok({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      return Result.fail('Failed to fetch user', 'FETCH_FAILED');
    }
  }
}
