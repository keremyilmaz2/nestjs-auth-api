import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WinstonLoggerService } from '@infrastructure/logging/winston-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(WinstonLoggerService);

  // Use custom logger
  app.useLogger(logger);

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription(
      `
## Professional NestJS API with Clean Architecture

### Features
- 🔐 JWT Authentication with Refresh Tokens
- 👥 Role-based Access Control (USER, MODERATOR, ADMIN)
- 📝 CRUD Operations for Posts
- 🏗️ Clean Architecture with Repository Pattern
- 🔄 Unit of Work Pattern for Transactions
- 📊 Pagination Support
- 📝 Comprehensive Logging
- ⚡ Exception Filters

### Authentication
All endpoints except \`/auth/register\`, \`/auth/login\`, and \`/auth/refresh\` require a valid JWT token.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

### Role Hierarchy
- **USER**: Can manage own posts
- **MODERATOR**: Can manage all posts and view users
- **ADMIN**: Full system access including user management
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Posts', 'Post management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
