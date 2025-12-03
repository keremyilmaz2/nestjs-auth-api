import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'My First Post',
    description: 'Title of the post',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @ApiProperty({
    example: 'This is the content of my first post...',
    description: 'Content of the post',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(50000, { message: 'Content must not exceed 50000 characters' })
  content: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to publish immediately',
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated Title',
    description: 'New title of the post',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated content...',
    description: 'New content of the post',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(50000, { message: 'Content must not exceed 50000 characters' })
  content?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the post is published',
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class PostResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'My First Post' })
  title: string;

  @ApiProperty({ example: 'This is the content of my first post...' })
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  authorId: string;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  publishedAt: Date | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class PaginatedPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  items: PostResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  pageSize: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}
