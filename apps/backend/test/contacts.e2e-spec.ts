import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('ContactsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizationId: string;
  let createdContactId: string;

  const testUser = {
    email: `contact-test-${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Contact',
    lastName: 'Tester',
    organizationName: 'Contact Test Org',
  };

  const testContact = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+7 999 123-45-67',
    position: 'CEO',
  };

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

    // Register and login to get access token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;

    // Get organization ID from user
    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    organizationId = meResponse.body.organizationMemberships?.[0]?.organizationId;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (createdContactId) {
        await prisma.contact.deleteMany({
          where: { id: createdContactId },
        });
      }
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('/api/contacts (POST)', () => {
    it('should create a new contact', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testContact)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(testContact.firstName);
      expect(response.body.lastName).toBe(testContact.lastName);
      expect(response.body.email).toBe(testContact.email);
      expect(response.body.phone).toBe(testContact.phone);

      createdContactId = response.body.id;
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send(testContact)
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'incomplete@example.com' })
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testContact,
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/api/contacts (GET)', () => {
    it('should return list of contacts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/contacts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/contacts?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/contacts?search=${testContact.firstName}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/contacts')
        .expect(401);
    });
  });

  describe('/api/contacts/:id (GET)', () => {
    it('should return a single contact', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdContactId);
      expect(response.body.firstName).toBe(testContact.firstName);
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app.getHttpServer())
        .get('/api/contacts/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/contacts/${createdContactId}`)
        .expect(401);
    });
  });

  describe('/api/contacts/:id (PATCH)', () => {
    it('should update a contact', async () => {
      const updateData = {
        firstName: 'Jane',
        position: 'CTO',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.position).toBe(updateData.position);
      expect(response.body.lastName).toBe(testContact.lastName); // unchanged
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app.getHttpServer())
        .patch('/api/contacts/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/contacts/${createdContactId}`)
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('/api/contacts/:id (DELETE)', () => {
    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/contacts/${createdContactId}`)
        .expect(401);
    });

    it('should delete a contact', async () => {
      await request(app.getHttpServer())
        .delete(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify contact is deleted
      await request(app.getHttpServer())
        .get(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      createdContactId = ''; // Clear to avoid cleanup error
    });

    it('should return 404 for non-existent contact', async () => {
      await request(app.getHttpServer())
        .delete('/api/contacts/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
