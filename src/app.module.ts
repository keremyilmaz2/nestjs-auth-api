import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure
import { DatabaseModule } from '@infrastructure/database/typeorm/database.module';
import { BcryptPasswordHasher } from '@infrastructure/services/bcrypt-password-hasher.service';
import { JwtTokenGenerator } from '@infrastructure/services/jwt-token-generator.service';
import { WinstonLoggerService } from '@infrastructure/logging/winston-logger.service';
import { PASSWORD_HASHER } from '@core/services/password-hasher.interface';
import { TOKEN_GENERATOR } from '@core/services/token-generator.interface';

// Presentation
import { AuthController, UsersController, PostsController } from '@presentation/controllers';
import { JwtAuthGuard, RolesGuard } from '@presentation/guards';
import { AllExceptionsFilter } from '@presentation/filters';
import { LoggingInterceptor, TransformInterceptor, TimeoutInterceptor } from '@presentation/interceptors';
import { CustomValidationPipe } from '@presentation/pipes';
import { CorrelationIdMiddleware } from '@presentation/middlewares';

// Application Handlers
import { RegisterHandler } from '@application/auth/commands/register';
import { LoginHandler } from '@application/auth/commands/login';
import { RefreshTokenHandler } from '@application/auth/commands/refresh-token';
import { GetUsersHandler } from '@application/users/queries/get-users';
import { GetUserByIdHandler } from '@application/users/queries/get-user-by-id';
import { DeleteUserHandler } from '@application/users/commands/delete-user';
import { CreatePostHandler } from '@application/posts/commands/create-post';
import { UpdatePostHandler } from '@application/posts/commands/update-post';
import { DeletePostHandler } from '@application/posts/commands/delete-post';
import { GetPostsHandler } from '@application/posts/queries/get-posts';
import { GetPostByIdHandler } from '@application/posts/queries/get-post-by-id';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-super-secret-key-change-in-production'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
    DatabaseModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    PostsController,
  ],
  providers: [
    // Logger
    WinstonLoggerService,

    // Services
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_GENERATOR,
      useClass: JwtTokenGenerator,
    },

    // Auth Handlers
    RegisterHandler,
    LoginHandler,
    RefreshTokenHandler,

    // User Handlers
    GetUsersHandler,
    GetUserByIdHandler,
    DeleteUserHandler,

    // Post Handlers
    CreatePostHandler,
    UpdatePostHandler,
    DeletePostHandler,
    GetPostsHandler,
    GetPostByIdHandler,

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(30000),
    },

    // Global Pipes
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
