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
        emailExists: jest.fn(),
        usernameExists: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
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
        findById: jest.fn(),
        findAll: jest.fn(),
        findAllPaginated: jest.fn(),
        create: jest.fn(),
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
      mockUnitOfWork.userRepository.emailExists.mockResolvedValue(false);
      mockUnitOfWork.userRepository.usernameExists.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('hashedPassword');
      mockTokenGenerator.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      mockUnitOfWork.userRepository.create.mockImplementation(async (user) => user);

      const result = await handler.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBe('refresh-token');
      expect(result.value.user.email).toBe('test@example.com');
      expect(result.value.user.username).toBe('testuser');
      expect(result.value.user.role).toBe(Role.USER);
    });

    it('should fail when email already exists', async () => {
      mockUnitOfWork.userRepository.emailExists.mockResolvedValue(true);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email already registered');
      expect(result.errorCode).toBe('EMAIL_EXISTS');
    });

    it('should fail when username already exists', async () => {
      mockUnitOfWork.userRepository.emailExists.mockResolvedValue(false);
      mockUnitOfWork.userRepository.usernameExists.mockResolvedValue(true);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Username already taken');
      expect(result.errorCode).toBe('USERNAME_EXISTS');
    });

    it('should hash the password before saving', async () => {
      mockUnitOfWork.userRepository.emailExists.mockResolvedValue(false);
      mockUnitOfWork.userRepository.usernameExists.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('hashedPassword');
      mockTokenGenerator.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      mockUnitOfWork.userRepository.create.mockImplementation(async (user) => user);

      await handler.execute(validCommand);

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('StrongP@ss123');
    });

    it('should execute within a transaction', async () => {
      mockUnitOfWork.userRepository.emailExists.mockResolvedValue(false);
      mockUnitOfWork.userRepository.usernameExists.mockResolvedValue(false);
      mockPasswordHasher.hash.mockResolvedValue('hashedPassword');
      mockTokenGenerator.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      mockUnitOfWork.userRepository.create.mockImplementation(async (user) => user);

      await handler.execute(validCommand);

      expect(mockUnitOfWork.executeInTransaction).toHaveBeenCalled();
    });
  });
});
