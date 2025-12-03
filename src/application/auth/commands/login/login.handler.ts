import { Injectable, Inject } from '@nestjs/common';
import { LoginCommand } from './login.command';
import { Result } from '@application/common/result';
import { AuthResponseDto } from '@application/auth/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { IPasswordHasher, PASSWORD_HASHER } from '@core/services/password-hasher.interface';
import { ITokenGenerator, TOKEN_GENERATOR } from '@core/services/token-generator.interface';

@Injectable()
export class LoginHandler implements IUseCase<LoginCommand, Result<AuthResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  async execute(command: LoginCommand): Promise<Result<AuthResponseDto>> {
    // Find user by email
    const user = await this.unitOfWork.userRepository.findByEmail(command.email.toLowerCase());
    if (!user) {
      return Result.fail('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      return Result.fail('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return Result.fail('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = this.tokenGenerator.generateTokenPair(tokenPayload);

    // Update refresh token
    user.setRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiresAt);

    try {
      await this.unitOfWork.executeInTransaction(async () => {
        await this.unitOfWork.userRepository.update(user);
      });
    } catch (error) {
      return Result.fail('Failed to update user session', 'UPDATE_FAILED');
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
