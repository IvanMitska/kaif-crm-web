import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AutomationService, AutomationTriggerType, AutomationActionType, ExecutionContext } from './automation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

describe('AutomationService', () => {
  let service: AutomationService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockAutomationId = 'automation-123';

  const mockAutomation = {
    id: mockAutomationId,
    name: 'Test Automation',
    description: 'Test description',
    isActive: true,
    organizationId: mockOrganizationId,
    trigger: {
      type: AutomationTriggerType.DEAL_STAGE_CHANGED,
      config: {
        fromStageId: 'stage-1',
        toStageId: 'stage-2',
      },
    },
    conditions: [],
    actions: [
      {
        type: AutomationActionType.CREATE_TASK,
        config: {
          taskTitle: 'Follow up task',
          taskDueDays: 3,
          taskPriority: 'HIGH',
          assignToOwner: true,
        },
      },
    ],
    lastRunAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    automation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an automation', async () => {
      const createDto = {
        name: 'New Automation',
        description: 'Test',
        trigger: { type: AutomationTriggerType.DEAL_CREATED },
        actions: [{ type: AutomationActionType.SEND_NOTIFICATION, config: {} }],
      };

      mockPrismaService.automation.create.mockResolvedValue({
        id: 'new-id',
        ...createDto,
        organizationId: mockOrganizationId,
      });

      const result = await service.create(createDto as any, mockOrganizationId);

      expect(mockPrismaService.automation.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrganizationId,
        },
      });
      expect(result.id).toBe('new-id');
    });
  });

  describe('findAll', () => {
    it('should return all automations for organization', async () => {
      const automations = [mockAutomation, { ...mockAutomation, id: 'automation-2' }];
      mockPrismaService.automation.findMany.mockResolvedValue(automations);

      const result = await service.findAll(mockOrganizationId);

      expect(mockPrismaService.automation.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a single automation', async () => {
      mockPrismaService.automation.findFirst.mockResolvedValue(mockAutomation);

      const result = await service.findOne(mockAutomationId, mockOrganizationId);

      expect(mockPrismaService.automation.findFirst).toHaveBeenCalledWith({
        where: { id: mockAutomationId, organizationId: mockOrganizationId },
      });
      expect(result).toEqual(mockAutomation);
    });

    it('should return null if automation not found', async () => {
      mockPrismaService.automation.findFirst.mockResolvedValue(null);

      const result = await service.findOne('non-existent', mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an automation', async () => {
      const updateDto = { name: 'Updated Name', isActive: false };
      mockPrismaService.automation.update.mockResolvedValue({
        ...mockAutomation,
        ...updateDto,
      });

      const result = await service.update(mockAutomationId, updateDto as any, mockOrganizationId);

      expect(mockPrismaService.automation.update).toHaveBeenCalledWith({
        where: { id: mockAutomationId },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should delete an automation', async () => {
      mockPrismaService.automation.delete.mockResolvedValue(mockAutomation);

      const result = await service.remove(mockAutomationId, mockOrganizationId);

      expect(mockPrismaService.automation.delete).toHaveBeenCalledWith({
        where: { id: mockAutomationId },
      });
      expect(result).toEqual(mockAutomation);
    });
  });

  describe('execute', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should throw NotFoundException if automation not found', async () => {
      mockPrismaService.automation.findFirst.mockResolvedValue(null);

      await expect(service.execute(mockAutomationId, context)).rejects.toThrow(NotFoundException);
    });

    it('should return failure if automation is inactive', async () => {
      mockPrismaService.automation.findFirst.mockResolvedValue({
        ...mockAutomation,
        isActive: false,
      });

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Автоматизация неактивна');
    });

    it('should execute automation with CREATE_TASK action', async () => {
      mockPrismaService.automation.findFirst.mockResolvedValue(mockAutomation);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(mockAutomation);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(1);
      expect(mockPrismaService.task.create).toHaveBeenCalled();
    });

    it('should execute automation with SEND_NOTIFICATION action', async () => {
      const automationWithNotification = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.SEND_NOTIFICATION,
            config: {
              notificationTitle: 'Test Notification',
              notificationContent: 'Test content for {{dealId}}',
              notifyOwner: true,
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithNotification);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
      });
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.automation.update.mockResolvedValue(automationWithNotification);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.createMany).toHaveBeenCalled();
    });

    it('should execute automation with UPDATE_FIELD action', async () => {
      const automationWithUpdateField = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.UPDATE_FIELD,
            config: {
              fieldName: 'probability',
              fieldValue: 75,
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithUpdateField);
      mockPrismaService.deal.update.mockResolvedValue({ id: 'deal-123', probability: 75 });
      mockPrismaService.automation.update.mockResolvedValue(automationWithUpdateField);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-123' },
        data: { probability: 75 },
      });
    });

    it('should execute automation with ASSIGN_OWNER action', async () => {
      const automationWithAssignOwner = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.ASSIGN_OWNER,
            config: {
              newOwnerId: 'new-owner-123',
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithAssignOwner);
      mockPrismaService.deal.update.mockResolvedValue({ id: 'deal-123', ownerId: 'new-owner-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithAssignOwner);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-123' },
        data: { ownerId: 'new-owner-123' },
      });
    });

    it('should execute automation with ADD_TAG action for contact', async () => {
      const automationWithAddTag = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.ADD_TAG,
            config: {
              tagId: 'tag-123',
            },
          },
        ],
      };
      const contextWithContact: ExecutionContext = {
        contactId: 'contact-123',
        userId: mockUserId,
        organizationId: mockOrganizationId,
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithAddTag);
      mockPrismaService.contact.update.mockResolvedValue({ id: 'contact-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithAddTag);

      const result = await service.execute(mockAutomationId, contextWithContact);

      expect(result.success).toBe(true);
      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
        data: {
          tags: {
            connect: { id: 'tag-123' },
          },
        },
      });
    });

    it('should handle action errors gracefully', async () => {
      const automationWithInvalidAction = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.UPDATE_FIELD,
            config: {
              // Missing fieldName - should cause error
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithInvalidAction);
      mockPrismaService.automation.update.mockResolvedValue(automationWithInvalidAction);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should evaluate conditions and skip if not met', async () => {
      const automationWithConditions = {
        ...mockAutomation,
        conditions: [
          {
            field: 'amount',
            operator: 'greater_than',
            value: 10000,
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithConditions);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        amount: 5000, // Less than condition
        contact: null,
        company: null,
        stage: null,
      });

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(0); // Actions should not be executed
    });

    it('should evaluate conditions and execute if met', async () => {
      const automationWithConditions = {
        ...mockAutomation,
        conditions: [
          {
            field: 'amount',
            operator: 'greater_than',
            value: 1000,
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithConditions);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        amount: 5000, // Greater than condition
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithConditions);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toBe(1);
    });

    it('should return failure when no actions defined', async () => {
      const automationNoActions = {
        ...mockAutomation,
        actions: null,
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationNoActions);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Нет действий для выполнения');
    });
  });

  describe('executeByTrigger', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should execute automations matching trigger type', async () => {
      mockPrismaService.automation.findMany.mockResolvedValue([mockAutomation]);
      mockPrismaService.automation.findFirst.mockResolvedValue(mockAutomation);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(mockAutomation);

      const results = await service.executeByTrigger(
        AutomationTriggerType.DEAL_STAGE_CHANGED,
        context,
        { fromStageId: 'stage-1', toStageId: 'stage-2' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should skip automations with non-matching trigger type', async () => {
      mockPrismaService.automation.findMany.mockResolvedValue([mockAutomation]);

      const results = await service.executeByTrigger(
        AutomationTriggerType.DEAL_CREATED, // Different trigger type
        context,
      );

      expect(results).toHaveLength(0);
    });

    it('should skip automations with non-matching trigger config', async () => {
      mockPrismaService.automation.findMany.mockResolvedValue([mockAutomation]);

      const results = await service.executeByTrigger(
        AutomationTriggerType.DEAL_STAGE_CHANGED,
        context,
        { fromStageId: 'stage-3', toStageId: 'stage-4' }, // Different stages
      );

      expect(results).toHaveLength(0);
    });

    it('should execute multiple matching automations', async () => {
      const automation2 = {
        ...mockAutomation,
        id: 'automation-2',
        trigger: {
          type: AutomationTriggerType.DEAL_STAGE_CHANGED,
          config: {}, // Empty config matches all
        },
      };
      mockPrismaService.automation.findMany.mockResolvedValue([mockAutomation, automation2]);
      mockPrismaService.automation.findFirst
        .mockResolvedValueOnce(mockAutomation)
        .mockResolvedValueOnce(automation2);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(mockAutomation);

      const results = await service.executeByTrigger(
        AutomationTriggerType.DEAL_STAGE_CHANGED,
        context,
        { fromStageId: 'stage-1', toStageId: 'stage-2' },
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('getActiveAutomations', () => {
    it('should return only active automations', async () => {
      const activeAutomations = [mockAutomation];
      mockPrismaService.automation.findMany.mockResolvedValue(activeAutomations);

      const result = await service.getActiveAutomations(mockOrganizationId);

      expect(mockPrismaService.automation.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          organizationId: mockOrganizationId,
        },
      });
      expect(result).toEqual(activeAutomations);
    });
  });

  describe('getAutomationsByTrigger', () => {
    it('should return automations with specific trigger type', async () => {
      const automations = [
        mockAutomation,
        {
          ...mockAutomation,
          id: 'automation-2',
          trigger: { type: AutomationTriggerType.DEAL_CREATED },
        },
      ];
      mockPrismaService.automation.findMany.mockResolvedValue(automations);

      const result = await service.getAutomationsByTrigger(
        AutomationTriggerType.DEAL_STAGE_CHANGED,
        mockOrganizationId,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAutomationId);
    });
  });

  describe('condition evaluation', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should evaluate equals condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'status', operator: 'equals', value: 'NEW' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        status: 'NEW',
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate not_equals condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'status', operator: 'not_equals', value: 'LOST' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        status: 'NEW',
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate contains condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'title', operator: 'contains', value: 'important' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        title: 'Very Important Deal',
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate less_than condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'amount', operator: 'less_than', value: 5000 }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        amount: 1000,
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate is_empty condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'description', operator: 'is_empty' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        description: null,
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate is_not_empty condition', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'title', operator: 'is_not_empty' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        title: 'Some Deal',
        ownerId: 'owner-123',
        contact: null,
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should evaluate nested field conditions', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'contact.firstName', operator: 'equals', value: 'John' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
        contact: { firstName: 'John', lastName: 'Doe' },
        company: null,
        stage: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should fail if entity not found for condition evaluation', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'amount', operator: 'greater_than', value: 1000 }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      const result = await service.execute(mockAutomationId, context);

      expect(result.actionsExecuted).toBe(0);
    });
  });

  describe('template interpolation', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      contactId: 'contact-456',
      taskId: 'task-789',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should interpolate dealId in task title', async () => {
      const automationWithTemplate = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.CREATE_TASK,
            config: {
              taskTitle: 'Follow up for deal {{dealId}}',
              taskDueDays: 1,
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithTemplate);
      mockPrismaService.task.create.mockResolvedValue({ id: 'new-task' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithTemplate);

      await service.execute(mockAutomationId, context);

      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Follow up for deal deal-123',
          }),
        }),
      );
    });
  });

  describe('contact context', () => {
    const contactContext: ExecutionContext = {
      contactId: 'contact-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should evaluate conditions for contact', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'firstName', operator: 'equals', value: 'John' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-123',
        firstName: 'John',
        ownerId: 'owner-123',
        company: null,
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, contactContext);

      expect(result.actionsExecuted).toBe(1);
    });

    it('should assign task to contact owner', async () => {
      const automationWithAssignToOwner = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.CREATE_TASK,
            config: {
              taskTitle: 'Contact task',
              taskDueDays: 1,
              assignToOwner: true,
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithAssignToOwner);
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-123',
        ownerId: 'contact-owner-123',
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithAssignToOwner);

      await service.execute(mockAutomationId, contactContext);

      expect(mockPrismaService.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assigneeId: 'contact-owner-123',
          }),
        }),
      );
    });

    it('should update field for contact', async () => {
      const automationWithUpdateField = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.UPDATE_FIELD,
            config: {
              fieldName: 'status',
              fieldValue: 'ACTIVE',
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithUpdateField);
      mockPrismaService.contact.update.mockResolvedValue({ id: 'contact-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithUpdateField);

      const result = await service.execute(mockAutomationId, contactContext);

      expect(result.success).toBe(true);
      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
        data: { status: 'ACTIVE' },
      });
    });

    it('should assign owner for contact', async () => {
      const automationWithAssignOwner = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.ASSIGN_OWNER,
            config: {
              newOwnerId: 'new-owner-123',
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithAssignOwner);
      mockPrismaService.contact.update.mockResolvedValue({ id: 'contact-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithAssignOwner);

      const result = await service.execute(mockAutomationId, contactContext);

      expect(result.success).toBe(true);
      expect(mockPrismaService.contact.update).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
        data: { ownerId: 'new-owner-123' },
      });
    });
  });

  describe('task context', () => {
    const taskContext: ExecutionContext = {
      taskId: 'task-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should evaluate conditions for task', async () => {
      const automationWithCondition = {
        ...mockAutomation,
        conditions: [{ field: 'status', operator: 'equals', value: 'PENDING' }],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithCondition);
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 'task-123',
        status: 'PENDING',
      });
      mockPrismaService.task.create.mockResolvedValue({ id: 'new-task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithCondition);

      const result = await service.execute(mockAutomationId, taskContext);

      expect(result.actionsExecuted).toBe(1);
    });
  });

  describe('notification recipients', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should not create notifications if no recipients', async () => {
      const automationWithNotification = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.SEND_NOTIFICATION,
            config: {
              notificationTitle: 'Test',
              notifyOwner: false,
              notifyUserIds: [],
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithNotification);
      mockPrismaService.automation.update.mockResolvedValue(automationWithNotification);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });

    it('should deduplicate notification recipients', async () => {
      const automationWithNotification = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.SEND_NOTIFICATION,
            config: {
              notificationTitle: 'Test',
              notifyOwner: true,
              notifyUserIds: ['owner-123', 'user-456', 'owner-123'], // Duplicate owner
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithNotification);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-123',
        ownerId: 'owner-123',
      });
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });
      mockPrismaService.automation.update.mockResolvedValue(automationWithNotification);

      await service.execute(mockAutomationId, context);

      // Should only create 2 notifications (owner-123 and user-456)
      const createManyCall = mockPrismaService.notification.createMany.mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    const context: ExecutionContext = {
      dealId: 'deal-123',
      userId: mockUserId,
      organizationId: mockOrganizationId,
    };

    it('should handle unknown action type', async () => {
      const automationWithUnknownAction = {
        ...mockAutomation,
        actions: [
          {
            type: 'unknown_action' as any,
            config: {},
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithUnknownAction);
      mockPrismaService.automation.update.mockResolvedValue(automationWithUnknownAction);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Неизвестный тип действия'));
    });

    it('should handle ASSIGN_OWNER without newOwnerId', async () => {
      const automationWithInvalidAssign = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.ASSIGN_OWNER,
            config: {
              // Missing newOwnerId
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithInvalidAssign);
      mockPrismaService.automation.update.mockResolvedValue(automationWithInvalidAssign);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('newOwnerId is required'));
    });

    it('should handle ADD_TAG without tagId', async () => {
      const automationWithInvalidTag = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.ADD_TAG,
            config: {
              // Missing tagId
            },
          },
        ],
      };
      const contactContext: ExecutionContext = {
        contactId: 'contact-123',
        userId: mockUserId,
        organizationId: mockOrganizationId,
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithInvalidTag);
      mockPrismaService.automation.update.mockResolvedValue(automationWithInvalidTag);

      const result = await service.execute(mockAutomationId, contactContext);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('tagId is required'));
    });

    it('should continue executing other actions if one fails', async () => {
      const automationWithMultipleActions = {
        ...mockAutomation,
        actions: [
          {
            type: AutomationActionType.UPDATE_FIELD,
            config: {
              // Missing fieldName - will fail
            },
          },
          {
            type: AutomationActionType.CREATE_TASK,
            config: {
              taskTitle: 'Valid task',
              taskDueDays: 1,
            },
          },
        ],
      };
      mockPrismaService.automation.findFirst.mockResolvedValue(automationWithMultipleActions);
      mockPrismaService.task.create.mockResolvedValue({ id: 'task-123' });
      mockPrismaService.automation.update.mockResolvedValue(automationWithMultipleActions);

      const result = await service.execute(mockAutomationId, context);

      expect(result.success).toBe(false);
      expect(result.actionsExecuted).toBe(1); // Second action should succeed
      expect(result.errors.length).toBe(1); // First action error
    });
  });
});
