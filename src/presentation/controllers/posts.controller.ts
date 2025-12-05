import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Role } from '@core/domain/enums/role.enum';
import {
  UpdatePostDto,
  PostResponseDto,
  PaginatedPostsResponseDto,
} from '@application/posts/dtos';
import { CreatePostCommand, CreatePostHandler } from '@application/posts/commands/create-post';
import { UpdatePostCommand, UpdatePostHandler } from '@application/posts/commands/update-post';
import { DeletePostCommand, DeletePostHandler } from '@application/posts/commands/delete-post';
import { GetPostsQuery, GetPostsHandler } from '@application/posts/queries/get-posts';
import { GetPostByIdQuery, GetPostByIdHandler } from '@application/posts/queries/get-post-by-id';

@ApiTags('Posts')
@ApiBearerAuth('JWT-auth')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPostHandler: CreatePostHandler,
    private readonly updatePostHandler: UpdatePostHandler,
    private readonly deletePostHandler: DeletePostHandler,
    private readonly getPostsHandler: GetPostsHandler,
    private readonly getPostByIdHandler: GetPostByIdHandler,
  ) {}

  @Post()
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(FilesInterceptor('images', 5))
@ApiOperation({ summary: 'Create a new post with optional images (USER+)' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', example: 'My Post Title' },
      content: { type: 'string', example: 'Post content here' },
      isPublished: { type: 'boolean', example: false },
      images: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
        description: 'Post images (optional, max 5 images, max 5MB each)',
      },
    },
    required: ['title', 'content'],
  },
})
@ApiResponse({
  status: 201,
  description: 'Post successfully created',
  type: PostResponseDto,
})
@ApiResponse({ status: 400, description: 'Validation error' })
async createPost(
  @Body('title') title: string,  // DEĞİŞTİ - tek tek parametre alıyoruz
  @Body('content') content: string,  // DEĞİŞTİ
  @Body('isPublished') isPublished: string | boolean,  // DEĞİŞTİ - string olabilir
  @CurrentUser() user: CurrentUserData,
  @UploadedFiles(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
      ],
      fileIsRequired: false,
    }),
  )
  files?: Express.Multer.File[],
): Promise<PostResponseDto> {
  // Validation
  if (!title || title.trim().length < 3) {
    throw new BadRequestException('Title must be at least 3 characters');
  }
  if (!content || content.trim().length < 10) {
    throw new BadRequestException('Content must be at least 10 characters');
  }
  if (files && files.length > 5) {
    throw new BadRequestException('Maximum 5 images allowed');
  }

  // isPublished string'den boolean'a çevir
  const isPublishedBool = isPublished === true || isPublished === 'true';

  const command = new CreatePostCommand(
    title,
    content,
    user.id,
    isPublishedBool,
    files,
  );

  const result = await this.createPostHandler.execute(command);

  if (result.isFailure) {
    throw new BadRequestException(result.error);
  }

  return result.value;
}

  @Get()
  @ApiOperation({ summary: 'Get all posts (USER+)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'onlyPublished', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of posts',
    type: PaginatedPostsResponseDto,
  })
  async getPosts(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('authorId') authorId?: string,
    @Query('onlyPublished') onlyPublished?: boolean,
  ): Promise<PaginatedPostsResponseDto> {
    const query = new GetPostsQuery(
      Math.max(1, Number(page) || 1),
      Math.min(100, Math.max(1, Number(pageSize) || 10)),
      authorId,
      onlyPublished === true || onlyPublished === 'true' as unknown as boolean,
    );

    const result = await this.getPostsHandler.execute(query);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user posts' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of current user posts',
    type: PaginatedPostsResponseDto,
  })
  async getMyPosts(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PaginatedPostsResponseDto> {
    const query = new GetPostsQuery(
      Math.max(1, Number(page) || 1),
      Math.min(100, Math.max(1, Number(pageSize) || 10)),
      user.id,
    );

    const result = await this.getPostsHandler.execute(query);

    if (result.isFailure) {
      throw new Error(result.error);
    }

    return result.value;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Post UUID' })
  @ApiResponse({
    status: 200,
    description: 'Post details',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostResponseDto> {
    const query = new GetPostByIdQuery(id);

    const result = await this.getPostByIdHandler.execute(query);

    if (result.isFailure) {
      throw new NotFoundException(result.error);
    }

    return result.value;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update post (Owner or MODERATOR+)' })
  @ApiParam({ name: 'id', type: String, description: 'Post UUID' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({
    status: 200,
    description: 'Post successfully updated',
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this post' })
  async updatePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<PostResponseDto> {
    const command = new UpdatePostCommand(
      id,
      user.id,
      user.role,
      dto.title,
      dto.content,
      dto.isPublished,
    );

    const result = await this.updatePostHandler.execute(command);

    if (result.isFailure) {
      if (result.errorCode === 'POST_NOT_FOUND') {
        throw new NotFoundException(result.error);
      }
      if (result.errorCode === 'FORBIDDEN') {
        throw new ForbiddenException(result.error);
      }
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Delete(':id')
  @Roles(Role.MODERATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete post (MODERATOR+)' })
  @ApiParam({ name: 'id', type: String, description: 'Post UUID' })
  @ApiResponse({ status: 204, description: 'Post successfully deleted' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires MODERATOR role' })
  async deletePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<void> {
    const command = new DeletePostCommand(id, user.id, user.role);

    const result = await this.deletePostHandler.execute(command);

    if (result.isFailure) {
      if (result.errorCode === 'POST_NOT_FOUND') {
        throw new NotFoundException(result.error);
      }
      if (result.errorCode === 'FORBIDDEN') {
        throw new ForbiddenException(result.error);
      }
      throw new Error(result.error);
    }
  }
}