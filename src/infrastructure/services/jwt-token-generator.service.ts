import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import {
  ITokenGenerator,
  TokenPayload,
  TokenPair,
} from '@core/services/token-generator.interface';

@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: number; // in days

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    this.refreshTokenExpiresIn = this.configService.get<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
      7,
    );
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  generateRefreshToken(): string {
    return uuidv4();
  }

  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(),
      accessTokenExpiresAt: this.getAccessTokenExpiration(),
      refreshTokenExpiresAt: this.getRefreshTokenExpiration(),
    };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  decodeToken(token: string): TokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  }

  getAccessTokenExpiration(): Date {
    const expiresIn = this.parseExpiresIn(this.accessTokenExpiresIn);
    return new Date(Date.now() + expiresIn);
  }

  getRefreshTokenExpiration(): Date {
    const expiresIn = this.refreshTokenExpiresIn * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + expiresIn);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60 * 1000; // default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }
}
