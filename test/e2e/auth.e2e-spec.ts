import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { S3Service } from '../../src/infrastructure/services/s3.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  // S3Service mock
  const mockS3Service = {
    uploadFile: jest.fn(),
    uploadMultipleFiles: jest.fn(),
    deleteFile: jest.fn(),
    deleteMultipleFiles: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)  // S3Service'i mock'la
      .useValue(mockS3Service)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    const validUser = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'StrongP@ss123',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data.user.email).toBe(validUser.email);
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: `test${Date.now()}@example.com`,
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    const testUser = {
      email: `logintest${Date.now()}@example.com`,
      username: `logintest${Date.now()}`,
      password: 'StrongP@ss123',
    };

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongP@ss123',
        })
        .expect(401);
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'StrongP@ss123',
        })
        .expect(401);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `refreshtest${Date.now()}@example.com`,
          username: `refreshtest${Date.now()}`,
          password: 'StrongP@ss123',
        });
      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});