import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostHandler } from '@application/posts/commands/create-post/create-post.handler';
import { CreatePostCommand } from '@application/posts/commands/create-post/create-post.command';
import { UNIT_OF_WORK, IUnitOfWork } from '@core/unit-of-work';
import { User } from '@core/domain/entities/user.entity';
import { Role } from '@core/domain/enums/role.enum';

describe('CreatePostHandler', () => {
  let handler: CreatePostHandler;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

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
        findById: jest.fn(),
        emailExists: jest.fn(),
        usernameExists: jest.fn(),
        create: jest.fn(),
        findByEmail: jest.fn(),
        findByUsername: jest.fn(),
        findByRefreshToken: jest.fn(),
        findByRole: jest.fn(),
        findActiveUsers: jest.fn(),
        findActiveUsersPaginated: jest.fn(),
        findAll: jest.fn(),
        findAllPaginated: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        count: jest.fn(),
      },
      postRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        findAllPaginated: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        count: jest.fn(),
        findByAuthorId: jest.fn(),
        findByAuthorIdPaginated: jest.fn(),
        findPublishedPosts: jest.fn(),
        findPublishedPostsPaginated: jest.fn(),
        findByTitle: jest.fn(),
        searchByContent: jest.fn(),
      },
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      executeInTransaction: jest.fn().mockImplementation(async (work) => work()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostHandler,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
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

    it('should successfully create a post', async () => {
      mockUnitOfWork.userRepository.findById.mockResolvedValue(mockUser);
      mockUnitOfWork.postRepository.create.mockImplementation(async (post) => post);

      const result = await handler.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.title).toBe('Test Post Title');
      expect(result.value.content).toBe('This is the content of the test post.');
      expect(result.value.authorId).toBe('author-id');
      expect(result.value.isPublished).toBe(false);
    });

    it('should create a published post when isPublished is true', async () => {
      const publishedCommand = new CreatePostCommand(
        'Published Post',
        'This is published content.',
        'author-id',
        true,
      );

      mockUnitOfWork.userRepository.findById.mockResolvedValue(mockUser);
      mockUnitOfWork.postRepository.create.mockImplementation(async (post) => post);

      const result = await handler.execute(publishedCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.isPublished).toBe(true);
      expect(result.value.publishedAt).not.toBeNull();
    });

    it('should fail when author is not found', async () => {
      mockUnitOfWork.userRepository.findById.mockResolvedValue(null);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Author not found');
      expect(result.errorCode).toBe('AUTHOR_NOT_FOUND');
    });

    it('should execute within a transaction', async () => {
      mockUnitOfWork.userRepository.findById.mockResolvedValue(mockUser);
      mockUnitOfWork.postRepository.create.mockImplementation(async (post) => post);

      await handler.execute(validCommand);

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    });
  });
});
