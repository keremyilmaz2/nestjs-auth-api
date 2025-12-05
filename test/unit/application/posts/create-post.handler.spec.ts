/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostHandler } from '@application/posts/commands/create-post/create-post.handler';
import { CreatePostCommand } from '@application/posts/commands/create-post/create-post.command';
import { UNIT_OF_WORK, IUnitOfWork } from '@core/unit-of-work';
import { S3Service } from '@infrastructure/services/s3.service';
import { User } from '@core/domain/entities/user.entity';
import { Role } from '@core/domain/enums/role.enum';

describe('CreatePostHandler', () => {
  let handler: CreatePostHandler;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockS3Service: jest.Mocked<S3Service>;

  const mockUser = User.create({
    id: 'author-id',
    email: 'author@example.com',
    username: 'author',
    passwordHash: 'hash',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUnitOfWork = {
      userRepository: {
        findById: jest.fn() as any,
        emailExists: jest.fn() as any,
        usernameExists: jest.fn() as any,
        create: jest.fn() as any,
        findByEmail: jest.fn() as any,
        findByUsername: jest.fn() as any,
        findByRefreshToken: jest.fn() as any,
        findByRole: jest.fn() as any,
        findActiveUsers: jest.fn() as any,
        findActiveUsersPaginated: jest.fn() as any,
        findAll: jest.fn() as any,
        findAllPaginated: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        exists: jest.fn() as any,
        count: jest.fn() as any,
      },
      postRepository: {
        create: jest.fn() as any,
        findById: jest.fn() as any,
        findAll: jest.fn() as any,
        findAllPaginated: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
        exists: jest.fn() as any,
        count: jest.fn() as any,
        findByAuthorId: jest.fn() as any,
        findByAuthorIdPaginated: jest.fn() as any,
        findPublishedPosts: jest.fn() as any,
        findPublishedPostsPaginated: jest.fn() as any,
        findByTitle: jest.fn() as any,
        searchByContent: jest.fn() as any,
      },
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation(async (work) => work()),
    } as any;

    mockS3Service = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
      deleteMultipleFiles: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostHandler,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    handler = module.get<CreatePostHandler>(CreatePostHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const validCommand = new CreatePostCommand(
      'Test Post Title',
      'This is the content of the test post.',
      'author-id',
      false,
    );

    it('should successfully create a post without images', async () => {
      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUnitOfWork.postRepository.create as jest.Mock).mockImplementation(async (post: any) => post);

      const result = await handler.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('Test Post Title');
      expect(result.value.content).toBe('This is the content of the test post.');
      expect(result.value.authorId).toBe('author-id');
      expect(result.value.isPublished).toBe(false);
      expect(result.value.images).toEqual([]);
    });

    it('should successfully create a post with images', async () => {
      const mockFiles = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
        },
        {
          fieldname: 'images',
          originalname: 'test2.png',
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: Buffer.from('test'),
          size: 2048,
        },
      ] as Express.Multer.File[];

      const commandWithImages = new CreatePostCommand(
        'Test Post with Images',
        'Content here',
        'author-id',
        false,
        mockFiles,
      );

      const mockUploadedFiles = [
        {
          url: 'https://s3.amazonaws.com/bucket/image1.jpg',
          key: 'posts/image1.jpg',
        },
        {
          url: 'https://s3.amazonaws.com/bucket/image2.png',
          key: 'posts/image2.png',
        },
      ];

      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockS3Service.uploadMultipleFiles as jest.Mock).mockResolvedValue(mockUploadedFiles);
      (mockUnitOfWork.postRepository.create as jest.Mock).mockImplementation(async (post: any) => post);

      const result = await handler.execute(commandWithImages);

      expect(result.isSuccess).toBe(true);
      expect(result.value.images).toHaveLength(2);
      expect(result.value.images[0].imageUrl).toBe('https://s3.amazonaws.com/bucket/image1.jpg');
      expect(result.value.images[1].imageUrl).toBe('https://s3.amazonaws.com/bucket/image2.png');
      expect(mockS3Service.uploadMultipleFiles).toHaveBeenCalledWith(mockFiles, 'posts');
    });

    it('should fail when image upload fails', async () => {
      const mockFiles = [
        {
          fieldname: 'images',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
        },
      ] as Express.Multer.File[];

      const commandWithImages = new CreatePostCommand(
        'Test Post',
        'Content',
        'author-id',
        false,
        mockFiles,
      );

      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockS3Service.uploadMultipleFiles as jest.Mock).mockRejectedValue(new Error('S3 upload failed'));

      const result = await handler.execute(commandWithImages);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Failed to upload images');
      expect(result.errorCode).toBe('UPLOAD_FAILED');
    });

    it('should create a published post when isPublished is true', async () => {
      const publishedCommand = new CreatePostCommand(
        'Published Post',
        'This is published content.',
        'author-id',
        true,
      );

      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUnitOfWork.postRepository.create as jest.Mock).mockImplementation(async (post: any) => post);

      const result = await handler.execute(publishedCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.isPublished).toBe(true);
      expect(result.value.publishedAt).not.toBeNull();
    });

    it('should fail when author is not found', async () => {
      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Author not found');
      expect(result.errorCode).toBe('AUTHOR_NOT_FOUND');
    });

    it('should execute within a transaction', async () => {
      (mockUnitOfWork.userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUnitOfWork.postRepository.create as jest.Mock).mockImplementation(async (post: any) => post);

      await handler.execute(validCommand);

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    });
  });
});