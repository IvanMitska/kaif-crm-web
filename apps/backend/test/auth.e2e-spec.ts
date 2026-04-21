import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Organization',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    } catch (e) {
      // Ignore if user doesn't exist
    }
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject registration with existing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' })
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });
  });

  describe('/api/auth/me (GET)', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('firstName', testUser.firstName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
