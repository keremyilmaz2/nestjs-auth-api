import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Role } from '@core/domain/enums/role.enum';
import {
  UserResponseDto,
  PaginatedUsersResponseDto,
} from '@application/users/dtos';
import { GetUsersQuery, GetUsersHandler } from '@application/users/queries/get-users';
import { GetUserByIdQuery, GetUserByIdHandler } from '@application/users/queries/get-user-by-id';
import { DeleteUserCommand, DeleteUserHandler } from '@application/users/commands/delete-user';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly getUsersHandler: GetUsersHandler,
    private readonly getUserByIdHandler: GetUserByIdHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
  ) {}

  @Get()
  @Roles(Role.MODERATOR)
  @ApiOperation({ summary: 'Get all users (MODERATOR+)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires MODERATOR role' })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ): Promise<PaginatedUsersResponseDto> {
    const query = new GetUsersQuery(
      Math.max(1, Number(page) || 1),
      Math.min(100, Math.max(1, Number(pageSize) || 10)),
    );

    const result = await this.getUsersHandler.execute(query);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserResponseDto,
  })
  async getCurrentUser(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserResponseDto> {
    const query = new GetUserByIdQuery(user.id);

    const result = await this.getUserByIdHandler.execute(query);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return result.value;
  }

  @Get(':id')
  @Roles(Role.MODERATOR)
  @ApiOperation({ summary: 'Get user by ID (MODERATOR+)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires MODERATOR role' })
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const query = new GetUserByIdQuery(id);

    const result = await this.getUserByIdHandler.execute(query);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return result.value;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (ADMIN only)' })
  @ApiParam({ name: 'id', type: String, description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires ADMIN role' })
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const command = new DeleteUserCommand(id, user.id);

    const result = await this.deleteUserHandler.execute(command);

    if (result.isFailure) {
      if (result.errorCode === 'USER_NOT_FOUND') {
        throw new NotFoundException(result.error);
      }
      if (result.errorCode === 'SELF_DELETE_FORBIDDEN') {
        throw new ForbiddenException(result.error);
      }
      throw new Error(result.error);
    }
  }
}
