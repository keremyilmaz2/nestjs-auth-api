import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from '@application/auth/dtos';
import { RegisterCommand, RegisterHandler } from '@application/auth/commands/register';
import { LoginCommand, LoginHandler } from '@application/auth/commands/login';
import { RefreshTokenCommand, RefreshTokenHandler } from '@application/auth/commands/refresh-token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshTokenHandler: RefreshTokenHandler,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or email/username already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const command = new RegisterCommand(
      dto.email,
      dto.username,
      dto.password,
      dto.role,
    );

    const result = await this.registerHandler.execute(command);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.value;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const command = new LoginCommand(dto.email, dto.password);

    const result = await this.loginHandler.execute(command);

    if (result.isFailure) {
      throw new UnauthorizedException(result.error);
    }

    return result.value;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const command = new RefreshTokenCommand(dto.refreshToken);

    const result = await this.refreshTokenHandler.execute(command);

    if (result.isFailure) {
      throw new UnauthorizedException(result.error);
    }

    return result.value;
  }
}
