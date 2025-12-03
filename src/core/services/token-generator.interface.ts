export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface ITokenGenerator {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(): string;
  generateTokenPair(payload: TokenPayload): TokenPair;
  verifyAccessToken(token: string): TokenPayload | null;
  decodeToken(token: string): TokenPayload | null;
  getAccessTokenExpiration(): Date;
  getRefreshTokenExpiration(): Date;
}

export const TOKEN_GENERATOR = Symbol('ITokenGenerator');
