import { Injectable, Inject } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import { Result } from '@application/common/result';
import { AuthResponseDto } from '@application/auth/dtos';
import { IUseCase } from '@application/common/interfaces/use-case.interface';
import { IUnitOfWork, UNIT_OF_WORK } from '@core/unit-of-work';
import { ITokenGenerator, TOKEN_GENERATOR } from '@core/services/token-generator.interface';

@Injectable()
export class RefreshTokenHandler implements IUseCase<RefreshTokenCommand, Result<AuthResponseDto>> {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
    @Inject(TOKEN_GENERATOR)
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<Result<AuthResponseDto>> {
    // Find user by refresh token
    const user = await this.unitOfWork.userRepository.findByRefreshToken(command.refreshToken);
    if (!user) {
      return Result.fail('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check if refresh token is still valid
    if (!user.isRefreshTokenValid()) {
      return Result.fail('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
    }

    // Check if user is active
    if (!user.isActive) {
      return Result.fail('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Generate new tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const tokens = this.tokenGenerator.generateTokenPair(tokenPayload);

    // Update refresh token (token rotation)
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
