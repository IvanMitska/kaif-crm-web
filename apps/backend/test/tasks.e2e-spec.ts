import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let organizationId: string;
  let createdTaskId: string;

  const testUser = {
    email: `task-test-${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Task',
    lastName: 'Tester',
    organizationName: 'Task Test Org',
  };

  const testTask = {
    title: 'Test Task',
    description: 'Test task description',
    priority: 'HIGH',
    status: 'PENDING',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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

    // Get user ID and organization ID
    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    userId = meResponse.body.id;
    organizationId = meResponse.body.organizationMemberships?.[0]?.organizationId;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (createdTaskId) {
        await prisma.task.deleteMany({
          where: { id: createdTaskId },
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

  describe('/api/tasks (POST)', () => {
    it('should create a new task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testTask)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testTask.title);
      expect(response.body.description).toBe(testTask.description);
      expect(response.body.priority).toBe(testTask.priority);
      expect(response.body.status).toBe(testTask.status);

      createdTaskId = response.body.id;
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .send(testTask)
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Only description' })
        .expect(400);
    });

    it('should create task with assignee', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testTask,
          title: 'Assigned Task',
          assigneeId: userId,
        })
        .expect(201);

      expect(response.body.assigneeId).toBe(userId);

      // Cleanup this task
      await prisma.task.delete({ where: { id: response.body.id } });
    });
  });

  describe('/api/tasks (GET)', () => {
    it('should return list of tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks?status=PENDING')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      response.body.items.forEach((task: any) => {
        expect(task.status).toBe('PENDING');
      });
    });

    it('should filter by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      response.body.items.forEach((task: any) => {
        expect(task.priority).toBe('HIGH');
      });
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/tasks')
        .expect(401);
    });
  });

  describe('/api/tasks/:id (GET)', () => {
    it('should return a single task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdTaskId);
      expect(response.body.title).toBe(testTask.title);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/tasks/${createdTaskId}`)
        .expect(401);
    });
  });

  describe('/api/tasks/:id (PATCH)', () => {
    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        priority: 'MEDIUM',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.description).toBe(testTask.description); // unchanged
    });

    it('should update task status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('should complete a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completedAt).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .patch('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/tasks/${createdTaskId}`)
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('/api/tasks/:id (DELETE)', () => {
    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tasks/${createdTaskId}`)
        .expect(401);
    });

    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      createdTaskId = ''; // Clear to avoid cleanup error
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Task lifecycle', () => {
    it('should handle complete task lifecycle', async () => {
      // 1. Create task
      const createResponse = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Lifecycle Test Task',
          description: 'Testing full lifecycle',
          priority: 'LOW',
          status: 'PENDING',
        })
        .expect(201);

      const taskId = createResponse.body.id;
      expect(createResponse.body.status).toBe('PENDING');

      // 2. Start working on task
      const startResponse = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(startResponse.body.status).toBe('IN_PROGRESS');

      // 3. Complete task
      const completeResponse = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('COMPLETED');

      // 4. Cleanup
      await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
