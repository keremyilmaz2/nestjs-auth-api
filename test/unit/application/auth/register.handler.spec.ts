/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { RegisterHandler } from '@application/auth/commands/register/register.handler';
import { RegisterCommand } from '@application/auth/commands/register/register.command';
import { UNIT_OF_WORK, IUnitOfWork } from '@core/unit-of-work';
import { PASSWORD_HASHER, IPasswordHasher } from '@core/services/password-hasher.interface';
import { TOKEN_GENERATOR, ITokenGenerator } from '@core/services/token-generator.interface';
import { Role } from '@core/domain/enums/role.enum';

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenGenerator: jest.Mocked<ITokenGenerator>;

  beforeEach(async () => {
    mockUnitOfWork = {
      userRepository: {
        emailExists: jest.fn() as any,
        usernameExists: jest.fn() as any,
        create: jest.fn() as any,
        findById: jest.fn() as any,
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
        findById: jest.fn() as any,
        findAll: jest.fn() as any,
        findAllPaginated: jest.fn() as any,
        create: jest.fn() as any,
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

    mockPasswordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenGenerator = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      generateTokenPair: jest.fn(),
      verifyAccessToken: jest.fn(),
      decodeToken: jest.fn(),
      getAccessTokenExpiration: jest.fn(),
      getRefreshTokenExpiration: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterHandler,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: PASSWORD_HASHER, useValue: mockPasswordHasher },
        { provide: TOKEN_GENERATOR, useValue: mockTokenGenerator },
      ],
    }).compile();

    handler = module.get<RegisterHandler>(RegisterHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const validCommand = new RegisterCommand(
      'test@example.com',
      'testuser',
      'StrongP@ss123',
      Role.USER,
    );

    it('should successfully register a new user', async () => {
      (mockUnitOfWork.userRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (mockUnitOfWork.userRepository.usernameExists as jest.Mock).mockResolvedValue(false);
      (mockPasswordHasher.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockTokenGenerator.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      (mockUnitOfWork.userRepository.create as jest.Mock).mockImplementation(async (user: any) => user);

      const result = await handler.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBe('refresh-token');
      expect(result.value.user.email).toBe('test@example.com');
      expect(result.value.user.username).toBe('testuser');
      expect(result.value.user.role).toBe(Role.USER);
    });

    it('should fail when email already exists', async () => {
      (mockUnitOfWork.userRepository.emailExists as jest.Mock).mockResolvedValue(true);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email already registered');
      expect(result.errorCode).toBe('EMAIL_EXISTS');
    });

    it('should fail when username already exists', async () => {
      (mockUnitOfWork.userRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (mockUnitOfWork.userRepository.usernameExists as jest.Mock).mockResolvedValue(true);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Username already taken');
      expect(result.errorCode).toBe('USERNAME_EXISTS');
    });

    it('should hash the password before saving', async () => {
      (mockUnitOfWork.userRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (mockUnitOfWork.userRepository.usernameExists as jest.Mock).mockResolvedValue(false);
      (mockPasswordHasher.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockTokenGenerator.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      (mockUnitOfWork.userRepository.create as jest.Mock).mockImplementation(async (user: any) => user);

      await handler.execute(validCommand);

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('StrongP@ss123');
    });

    it('should execute within a transaction', async () => {
      (mockUnitOfWork.userRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (mockUnitOfWork.userRepository.usernameExists as jest.Mock).mockResolvedValue(false);
      (mockPasswordHasher.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockTokenGenerator.generateTokenPair as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      (mockUnitOfWork.userRepository.create as jest.Mock).mockImplementation(async (user: any) => user);

      await handler.execute(validCommand);

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    });
  });
});