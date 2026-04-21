import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DealsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let organizationId: string;
  let createdDealId: string;
  let pipelineId: string;
  let stageId: string;

  const testUser = {
    email: `deal-test-${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Deal',
    lastName: 'Tester',
    organizationName: 'Deal Test Org',
  };

  const testDeal = {
    title: 'Test Deal',
    amount: 50000,
    description: 'Test deal description',
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

    // Get or create a pipeline with stages for testing
    const pipelinesResponse = await request(app.getHttpServer())
      .get('/api/pipelines')
      .set('Authorization', `Bearer ${accessToken}`);

    if (pipelinesResponse.body && pipelinesResponse.body.length > 0) {
      pipelineId = pipelinesResponse.body[0].id;
      stageId = pipelinesResponse.body[0].stages?.[0]?.id;
    }

    // If no pipeline exists, create one
    if (!pipelineId) {
      const createPipelineResponse = await request(app.getHttpServer())
        .post('/api/pipelines')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Pipeline',
          stages: [
            { name: 'New', color: '#6366f1', order: 0 },
            { name: 'Negotiation', color: '#f59e0b', order: 1 },
            { name: 'Won', color: '#10b981', order: 2 },
          ],
        });

      pipelineId = createPipelineResponse.body.id;
      stageId = createPipelineResponse.body.stages?.[0]?.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (createdDealId) {
        await prisma.deal.deleteMany({
          where: { id: createdDealId },
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

  describe('/api/deals (POST)', () => {
    it('should create a new deal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testDeal,
          stageId: stageId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testDeal.title);
      expect(response.body.amount).toBe(testDeal.amount);

      createdDealId = response.body.id;
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/deals')
        .send({ ...testDeal, stageId })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Only description' })
        .expect(400);
    });
  });

  describe('/api/deals (GET)', () => {
    it('should return list of deals', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/deals?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter by stage', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/deals?stageId=${stageId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/deals')
        .expect(401);
    });
  });

  describe('/api/deals/:id (GET)', () => {
    it('should return a single deal', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdDealId);
      expect(response.body.title).toBe(testDeal.title);
    });

    it('should return 404 for non-existent deal', async () => {
      await request(app.getHttpServer())
        .get('/api/deals/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/deals/${createdDealId}`)
        .expect(401);
    });
  });

  describe('/api/deals/:id (PATCH)', () => {
    it('should update a deal', async () => {
      const updateData = {
        title: 'Updated Deal Title',
        amount: 75000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.amount).toBe(updateData.amount);
    });

    it('should return 404 for non-existent deal', async () => {
      await request(app.getHttpServer())
        .patch('/api/deals/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/deals/${createdDealId}`)
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('/api/deals/:id/move (PATCH)', () => {
    it('should move deal to another stage', async () => {
      // Get all stages
      const pipelinesResponse = await request(app.getHttpServer())
        .get('/api/pipelines')
        .set('Authorization', `Bearer ${accessToken}`);

      const stages = pipelinesResponse.body[0]?.stages || [];
      const newStageId = stages.find((s: any) => s.id !== stageId)?.id;

      if (newStageId) {
        const response = await request(app.getHttpServer())
          .patch(`/api/deals/${createdDealId}/move`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ stageId: newStageId })
          .expect(200);

        expect(response.body.stageId).toBe(newStageId);
      }
    });
  });

  describe('/api/deals/:id (DELETE)', () => {
    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/deals/${createdDealId}`)
        .expect(401);
    });

    it('should delete a deal', async () => {
      await request(app.getHttpServer())
        .delete(`/api/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deal is deleted
      await request(app.getHttpServer())
        .get(`/api/deals/${createdDealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      createdDealId = ''; // Clear to avoid cleanup error
    });

    it('should return 404 for non-existent deal', async () => {
      await request(app.getHttpServer())
        .delete('/api/deals/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/api/pipelines (GET)', () => {
    it('should return list of pipelines', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/pipelines')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('stages');
      }
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/pipelines')
        .expect(401);
    });
  });
});
