import { Test, TestingModule } from '@nestjs/testing';
import { LoginHandler } from '@application/auth/commands/login/login.handler';
import { LoginCommand } from '@application/auth/commands/login/login.command';
import { UNIT_OF_WORK, IUnitOfWork } from '@core/unit-of-work';
import { PASSWORD_HASHER, IPasswordHasher } from '@core/services/password-hasher.interface';
import { TOKEN_GENERATOR, ITokenGenerator } from '@core/services/token-generator.interface';
import { User } from '@core/domain/entities/user.entity';
import { Role } from '@core/domain/enums/role.enum';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenGenerator: jest.Mocked<ITokenGenerator>;

  const mockUser = User.create({
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedPassword',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockUnitOfWork = {
      userRepository: {
        findByEmail: jest.fn(),
        update: jest.fn(),
        emailExists: jest.fn(),
        usernameExists: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByUsername: jest.fn(),
        findByRefreshToken: jest.fn(),
        findByRole: jest.fn(),
        findActiveUsers: jest.fn(),
        findActiveUsersPaginated: jest.fn(),
        findAll: jest.fn(),
        findAllPaginated: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        count: jest.fn(),
      },
      postRepository: {} as any,
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
        LoginHandler,
        { provide: UNIT_OF_WORK, useValue: mockUnitOfWork },
        { provide: PASSWORD_HASHER, useValue: mockPasswordHasher },
        { provide: TOKEN_GENERATOR, useValue: mockTokenGenerator },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const validCommand = new LoginCommand('test@example.com', 'password123');

    it('should successfully login with valid credentials', async () => {
      mockUnitOfWork.userRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenGenerator.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      });
      mockUnitOfWork.userRepository.update.mockResolvedValue(mockUser);

      const result = await handler.execute(validCommand);

      expect(result.isSuccess).toBe(true);
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBe('refresh-token');
    });

    it('should fail when user is not found', async () => {
      mockUnitOfWork.userRepository.findByEmail.mockResolvedValue(null);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email or password');
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should fail when password is incorrect', async () => {
      mockUnitOfWork.userRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(false);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Invalid email or password');
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should fail when account is deactivated', async () => {
      const deactivatedUser = User.create({
        ...mockUser.toProps(),
        isActive: false,
      });
      mockUnitOfWork.userRepository.findByEmail.mockResolvedValue(deactivatedUser);

      const result = await handler.execute(validCommand);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Account is deactivated');
      expect(result.errorCode).toBe('ACCOUNT_DEACTIVATED');
    });
  });
});
