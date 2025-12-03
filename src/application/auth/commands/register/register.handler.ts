import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RegisterCommand } from './register.command';
import { Result } from '@application/common/result';
import { AuthResponseDto } from '@application/auth/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { User } from '@core/domain/entities';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { IPasswordHasher, PASSWORD_HASHER } from '@core/services/password-hasher.interface';
import { ITokenGenerator, TOKEN_GENERATOR } from '@core/services/token-generator.interface';

@Injectable()
export class RegisterHandler implements IUseCase<RegisterCommand, Result<AuthResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  async execute(command: RegisterCommand): Promise<Result<AuthResponseDto>> {
    // Check if email already exists
    const emailExists = await this.unitOfWork.userRepository.emailExists(command.email);
    if (emailExists) {
      return Result.fail('Email already registered', 'EMAIL_EXISTS');
    }

    // Check if username already exists
    const usernameExists = await this.unitOfWork.userRepository.usernameExists(command.username);
    if (usernameExists) {
      return Result.fail('Username already taken', 'USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(command.password);

    // Create user entity
    const userId = uuidv4();
    const user = User.createNew(
      userId,
      command.email.toLowerCase(),
      command.username,
      passwordHash,
      command.role,
    );

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = this.tokenGenerator.generateTokenPair(tokenPayload);

    // Set refresh token on user
    user.setRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiresAt);

    // Save user within transaction
    try {
      await this.unitOfWork.executeInTransaction(async () => {
        await this.unitOfWork.userRepository.create(user);
      });
    } catch (error) {
      return Result.fail('Failed to create user', 'CREATE_FAILED');
    }

    return Result.ok({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  }
}
