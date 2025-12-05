import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostCommand } from './create-post.command';
import { Result } from '@application/common/result';
import { PostResponseDto } from '@application/posts/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { Post, PostImage } from '@core/domain/entities';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { S3Service } from '@infrastructure/services/s3.service';

@Injectable()
export class CreatePostHandler implements IUseCase<CreatePostCommand, Result<PostResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    private readonly s3Service: S3Service, // YENİ
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

    // Upload images to S3 if provided
    if (command.imageFiles && command.imageFiles.length > 0) {
      try {
        const uploadedFiles = await this.s3Service.uploadMultipleFiles(
          command.imageFiles,
          'posts',
        );

        // Create PostImage entities
        const postImages = uploadedFiles.map((file, index) =>
          PostImage.createNew(
            uuidv4(),
            postId,
            file.url,
            file.key,
            index,
          ),
        );

        // Add images to post
        post.addImages(postImages);
      } catch (error) {
        return Result.fail('Failed to upload images', 'UPLOAD_FAILED');
      }
    }

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
      images: post.images.map((img) => ({
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