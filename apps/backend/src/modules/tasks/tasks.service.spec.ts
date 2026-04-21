import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { CalendarView } from './dto/calendar-filter.dto';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockTask = {
    id: 'task-123',
    title: 'Тестовая задача',
    description: 'Описание задачи',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2024-12-31'),
    completedAt: null,
    assigneeId: mockUserId,
    createdById: mockUserId,
    contactId: null,
    dealId: null,
    organizationId: mockOrgId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskWithRelations = {
    ...mockTask,
    assignee: {
      id: mockUserId,
      email: 'user@example.com',
      firstName: 'Иван',
      lastName: 'Иванов',
      avatar: null,
    },
    contact: null,
    deal: null,
    createdBy: {
      id: mockUserId,
      firstName: 'Иван',
      lastName: 'Иванов',
    },
  };

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
  };

  const mockAutomationService = {
    executeByTrigger: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      title: 'Новая задача',
      description: 'Описание',
      priority: TaskPriority.HIGH,
      dueDate: '2024-12-31',
    };

    it('should create a task with default assignee', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTaskWithRelations);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toEqual(mockTaskWithRelations);
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          assigneeId: mockUserId,
          createdById: mockUserId,
          organizationId: mockOrgId,
        }),
        include: expect.any(Object),
      });
    });

    it('should create a task with specified assignee', async () => {
      const otherUserId = 'other-user';
      const dtoWithAssignee = { ...createDto, assigneeId: otherUserId };
      mockPrismaService.task.create.mockResolvedValue({
        ...mockTaskWithRelations,
        assigneeId: otherUserId,
      });
      mockPrismaService.notification.create.mockResolvedValue({});

      await service.create(dtoWithAssignee, mockUserId, mockOrgId);

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should not create notification when self-assigning', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTaskWithRelations);

      await service.create(createDto, mockUserId, mockOrgId);

      expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
    });

    it('should create activity when task is linked to contact', async () => {
      const dtoWithContact = { ...createDto, contactId: 'contact-123' };
      mockPrismaService.task.create.mockResolvedValue({
        ...mockTaskWithRelations,
        contactId: 'contact-123',
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.create(dtoWithContact, mockUserId, mockOrgId);

      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'task_created',
          contactId: 'contact-123',
        }),
      });
    });

    it('should create activity when task is linked to deal', async () => {
      const dtoWithDeal = { ...createDto, dealId: 'deal-123' };
      mockPrismaService.task.create.mockResolvedValue({
        ...mockTaskWithRelations,
        dealId: 'deal-123',
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.create(dtoWithDeal, mockUserId, mockOrgId);

      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'task_created',
          dealId: 'deal-123',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([mockTaskWithRelations]);
      mockPrismaService.task.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockOrgId);

      expect(result).toEqual({
        data: [mockTaskWithRelations],
        total: 1,
        skip: 0,
        take: 20,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ search: 'тест' }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ status: TaskStatus.PENDING }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TaskStatus.PENDING,
          }),
        })
      );
    });

    it('should filter by priority', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ priority: TaskPriority.URGENT }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: TaskPriority.URGENT,
          }),
        })
      );
    });

    it('should filter by assigneeId', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ assigneeId: 'user-456' }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: 'user-456',
          }),
        })
      );
    });

    it('should filter by due date range', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({
        dueDateFrom: '2024-01-01',
        dueDateTo: '2024-12-31',
      }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.any(Object),
          }),
        })
      );
    });

    it('should filter overdue tasks', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ overdue: true }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: { lt: expect.any(Date) },
            status: { not: TaskStatus.COMPLETED },
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);
      mockPrismaService.task.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'priority', sortOrder: 'desc' }, mockOrgId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: 'desc' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(mockTaskWithRelations);

      const result = await service.findOne('task-123', mockOrgId);

      expect(result).toEqual(mockTaskWithRelations);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Обновленная задача',
      priority: TaskPriority.URGENT,
    };

    it('should update task successfully', async () => {
      const updatedTask = { ...mockTaskWithRelations, ...updateDto };
      mockPrismaService.task.findFirst.mockResolvedValue(mockTaskWithRelations);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update('task-123', updateDto, mockUserId, mockOrgId);

      expect(result.title).toBe('Обновленная задача');
      expect(result.priority).toBe(TaskPriority.URGENT);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown', updateDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should create notification when assignee changes', async () => {
      const newAssignee = 'new-user-123';
      mockPrismaService.task.findFirst.mockResolvedValue(mockTaskWithRelations);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTaskWithRelations,
        assigneeId: newAssignee,
      });
      mockPrismaService.notification.create.mockResolvedValue({});

      await service.update('task-123', { assigneeId: newAssignee }, mockUserId, mockOrgId);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'task_assigned',
          userId: newAssignee,
        }),
      });
    });

    it('should create notification when task is completed', async () => {
      const creatorId = 'creator-123';
      mockPrismaService.task.findFirst.mockResolvedValue({
        ...mockTaskWithRelations,
        createdById: creatorId,
      });
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTaskWithRelations,
        status: TaskStatus.COMPLETED,
        createdById: creatorId,
      });
      mockPrismaService.notification.create.mockResolvedValue({});

      await service.update('task-123', { status: TaskStatus.COMPLETED }, mockUserId, mockOrgId);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'task_completed',
          userId: creatorId,
        }),
      });
    });
  });

  describe('remove', () => {
    it('should delete task successfully', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove('task-123', mockOrgId);

      expect(result).toEqual({ message: 'Задача успешно удалена' });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.remove('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(mockTaskWithRelations);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTaskWithRelations,
        status: TaskStatus.COMPLETED,
        completedAt: expect.any(Date),
      });

      const result = await service.completeTask('task-123', mockOrgId);

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.completeTask('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCalendarTasks', () => {
    it('should return tasks for month view by default', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([mockTaskWithRelations]);

      const result = await service.getCalendarTasks({}, mockOrgId);

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('view', 'month');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('totalTasks', 1);
    });

    it('should return tasks for day view', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getCalendarTasks({ view: CalendarView.DAY }, mockOrgId);

      expect(result.view).toBe('day');
    });

    it('should return tasks for week view', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getCalendarTasks({ view: CalendarView.WEEK }, mockOrgId);

      expect(result.view).toBe('week');
    });

    it('should group tasks by date', async () => {
      const task1 = { ...mockTaskWithRelations, dueDate: new Date('2024-12-15') };
      const task2 = { ...mockTaskWithRelations, dueDate: new Date('2024-12-15') };
      const task3 = { ...mockTaskWithRelations, dueDate: new Date('2024-12-20') };
      mockPrismaService.task.findMany.mockResolvedValue([task1, task2, task3]);

      const result = await service.getCalendarTasks({}, mockOrgId);

      expect(result.tasks['2024-12-15']).toHaveLength(2);
      expect(result.tasks['2024-12-20']).toHaveLength(1);
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      mockPrismaService.task.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50)  // completed
        .mockResolvedValueOnce(30)  // pending
        .mockResolvedValueOnce(5)   // overdue
        .mockResolvedValueOnce(10)  // today
        .mockResolvedValueOnce(25); // week

      mockPrismaService.task.groupBy
        .mockResolvedValueOnce([
          { priority: TaskPriority.HIGH, _count: { id: 20 } },
          { priority: TaskPriority.MEDIUM, _count: { id: 50 } },
        ])
        .mockResolvedValueOnce([
          { status: TaskStatus.PENDING, _count: { id: 30 } },
          { status: TaskStatus.COMPLETED, _count: { id: 50 } },
        ]);

      const result = await service.getTaskStats(mockOrgId);

      expect(result.summary.totalTasks).toBe(100);
      expect(result.summary.completedTasks).toBe(50);
      expect(result.summary.completionRate).toBe(50);
      expect(result.byPriority).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('should handle zero tasks', async () => {
      mockPrismaService.task.count.mockResolvedValue(0);
      mockPrismaService.task.groupBy.mockResolvedValue([]);

      const result = await service.getTaskStats(mockOrgId);

      expect(result.summary.completionRate).toBe(0);
    });
  });

  describe('createRecurringTask', () => {
    const createDto = {
      title: 'Повторяющаяся задача',
      dueDate: '2024-01-01',
      priority: TaskPriority.MEDIUM,
    };

    it('should create daily recurring tasks', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTaskWithRelations);

      const result = await service.createRecurringTask(
        createDto,
        'daily',
        mockUserId,
        mockOrgId
      );

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.tasks.length).toBeLessThanOrEqual(31);
    });

    it('should create weekly recurring tasks', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTaskWithRelations);

      const result = await service.createRecurringTask(
        createDto,
        'weekly',
        mockUserId,
        mockOrgId
      );

      expect(result.tasks.length).toBeLessThanOrEqual(12);
    });

    it('should create monthly recurring tasks', async () => {
      mockPrismaService.task.create.mockResolvedValue(mockTaskWithRelations);

      const result = await service.createRecurringTask(
        createDto,
        'monthly',
        mockUserId,
        mockOrgId
      );

      expect(result.tasks.length).toBe(12);
    });

    it('should append sequence number to task titles', async () => {
      let callCount = 0;
      mockPrismaService.task.create.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ...mockTaskWithRelations,
          title: `Повторяющаяся задача - ${callCount}`,
        });
      });

      const result = await service.createRecurringTask(
        createDto,
        'monthly',
        mockUserId,
        mockOrgId
      );

      expect(result.tasks[0].title).toContain('- 1');
    });
  });
});
