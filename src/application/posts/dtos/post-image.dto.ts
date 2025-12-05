import { ApiProperty } from '@nestjs/swagger';

export class PostImageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ 
    example: 'https://nestjs-auth-api-posts-images.s3.us-west-1.amazonaws.com/posts/image.jpg' 
  })
  imageUrl: string;

  @ApiProperty({ example: 'posts/123e4567-e89b-12d3-a456-426614174001.jpg' })
  s3Key: string;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}