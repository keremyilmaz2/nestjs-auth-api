import { Injectable, Inject } from '@nestjs/common';
import { GetUsersQuery } from './get-users.query';
import { Result } from '@application/common/result';
import { PaginatedUsersResponseDto, UserResponseDto } from '@application/users/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';

@Injectable()
export class GetUsersHandler implements IUseCase<GetUsersQuery, Result<PaginatedUsersResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(query: GetUsersQuery): Promise<Result<PaginatedUsersResponseDto>> {
    try {
      const paginatedResult = await this.unitOfWork.userRepository.findActiveUsersPaginated(
        query.page,
        query.pageSize,
      );

      const items: UserResponseDto[] = paginatedResult.items.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
      return Result.fail('Failed to fetch users', 'FETCH_FAILED');
    }
  }
}
