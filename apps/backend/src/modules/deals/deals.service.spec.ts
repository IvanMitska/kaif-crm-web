import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { DealStatus } from '@prisma/client';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockStage = {
    id: 'stage-1',
    name: 'Новая',
    order: 1,
    color: '#3b82f6',
    pipelineId: 'pipeline-123',
  };

  const mockPipeline = {
    id: 'pipeline-123',
    name: 'Основная воронка',
    isDefault: true,
    organizationId: mockOrgId,
    stages: [
      { id: 'stage-1', name: 'Новая', order: 1, color: '#3b82f6', pipelineId: 'pipeline-123' },
      { id: 'stage-2', name: 'В работе', order: 2, color: '#f59e0b', pipelineId: 'pipeline-123' },
      { id: 'stage-3', name: 'Завершена', order: 3, color: '#10b981', pipelineId: 'pipeline-123' },
    ],
  };

  const mockDeal = {
    id: 'deal-123',
    title: 'Тестовая сделка',
    amount: 100000,
    currency: 'RUB',
    probability: 50,
    expectedDate: new Date('2024-12-31'),
    description: 'Описание сделки',
    status: DealStatus.NEW,
    stageId: 'stage-1',
    contactId: null,
    companyId: null,
    ownerId: mockUserId,
    createdById: mockUserId,
    organizationId: mockOrgId,
    customFields: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDealWithRelations = {
    ...mockDeal,
    stage: { ...mockStage, pipeline: mockPipeline },
    contact: null,
    company: null,
    owner: {
      id: mockUserId,
      email: 'owner@example.com',
      firstName: 'Владелец',
      lastName: 'Тестов',
    },
    createdBy: {
      id: mockUserId,
      email: 'owner@example.com',
      firstName: 'Владелец',
      lastName: 'Тестов',
    },
    products: [],
    tasks: [],
    activities: [],
  };

  const mockPrismaService = {
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    pipeline: {
      findFirst: jest.fn(),
    },
    stage: {
      findUnique: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
    dealProduct: {
      createMany: jest.fn(),
    },
    automation: {
      findMany: jest.fn(),
    },
  };

  const mockAutomationService = {
    executeByTrigger: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ success: true, actionsExecuted: 0, errors: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      title: 'Новая сделка',
      amount: 50000,
    };

    it('should create a deal with default pipeline and stage', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.create.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toEqual(mockDealWithRelations);
      expect(mockPrismaService.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          amount: createDto.amount,
          organizationId: mockOrgId,
          stageId: 'stage-1',
          ownerId: mockUserId,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException when no default pipeline', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createDto, mockUserId, mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pipeline has no stages', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue({
        ...mockPipeline,
        stages: [],
      });

      await expect(
        service.create(createDto, mockUserId, mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create deal with custom stageId', async () => {
      const dtoWithStage = { ...createDto, stageId: 'stage-2' };
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.create.mockResolvedValue({
        ...mockDealWithRelations,
        stageId: 'stage-2',
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.create(dtoWithStage, mockUserId, mockOrgId);

      expect(mockPrismaService.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stageId: 'stage-2',
        }),
        include: expect.any(Object),
      });
    });

    it('should create deal with products', async () => {
      const dtoWithProducts = {
        ...createDto,
        products: [
          { productId: 'prod-1', quantity: 2, price: 10000, discount: 5 },
        ],
      };
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.create.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.create(dtoWithProducts, mockUserId, mockOrgId);

      expect(mockPrismaService.deal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          products: {
            create: expect.arrayContaining([
              expect.objectContaining({
                productId: 'prod-1',
                quantity: 2,
                price: 10000,
                discount: 5,
              }),
            ]),
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated deals', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([mockDealWithRelations]);
      mockPrismaService.deal.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockOrgId);

      expect(result).toEqual({
        data: [mockDealWithRelations],
        total: 1,
        skip: 0,
        take: 20,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ search: 'тест' }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ status: DealStatus.NEW }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DealStatus.NEW,
          }),
        })
      );
    });

    it('should filter by stageId', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ stageId: 'stage-1' }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stageId: 'stage-1',
          }),
        })
      );
    });

    it('should filter by pipelineId', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ pipelineId: 'pipeline-123' }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: { pipelineId: 'pipeline-123' },
          }),
        })
      );
    });

    it('should filter by minAmount', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ minAmount: 10000 }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            amount: { gte: 10000 },
          }),
        })
      );
    });

    it('should filter by maxAmount', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ maxAmount: 100000 }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            amount: { lte: 100000 },
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(50);

      const result = await service.findAll({ skip: 10, take: 5 }, mockOrgId);

      expect(result.skip).toBe(10);
      expect(result.take).toBe(5);
    });

    it('should apply sorting', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'amount', sortOrder: 'desc' }, mockOrgId);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: 'desc' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a deal by id', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);

      const result = await service.findOne('deal-123', mockOrgId);

      expect(result).toEqual(mockDealWithRelations);
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Обновленная сделка',
      amount: 150000,
    };

    it('should update deal successfully', async () => {
      const updatedDeal = { ...mockDealWithRelations, ...updateDto };
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.deal.update.mockResolvedValue(updatedDeal);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.update('deal-123', updateDto, mockUserId, mockOrgId);

      expect(result.title).toBe('Обновленная сделка');
      expect(result.amount).toBe(150000);
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown', updateDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update products when provided', async () => {
      const updateWithProducts = {
        ...updateDto,
        products: [{ productId: 'prod-1', quantity: 3, price: 15000 }],
      };
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.deal.update.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.update('deal-123', updateWithProducts, mockUserId, mockOrgId);

      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-123' },
        data: expect.objectContaining({
          products: {
            deleteMany: {},
            create: expect.any(Array),
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('moveDeal', () => {
    const moveDealDto = { stageId: 'stage-2' };

    it('should move deal to new stage', async () => {
      const newStage = {
        ...mockStage,
        id: 'stage-2',
        name: 'В работе',
        order: 2,
        pipeline: mockPipeline,
      };

      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.stage.findUnique.mockResolvedValue(newStage);
      mockPrismaService.deal.update.mockResolvedValue({
        ...mockDealWithRelations,
        stageId: 'stage-2',
        status: DealStatus.QUALIFICATION,
      });
      mockPrismaService.activity.create.mockResolvedValue({});
      mockPrismaService.automation.findMany.mockResolvedValue([]);

      const result = await service.moveDeal('deal-123', moveDealDto, mockUserId, mockOrgId);

      expect(result.stageId).toBe('stage-2');
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.moveDeal('unknown', moveDealDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when stage not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.stage.findUnique.mockResolvedValue(null);

      await expect(
        service.moveDeal('deal-123', moveDealDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete deal successfully', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDeal);
      mockPrismaService.deal.delete.mockResolvedValue(mockDeal);

      const result = await service.remove('deal-123', mockOrgId);

      expect(result).toEqual({ message: 'Сделка успешно удалена' });
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(service.remove('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('closeDeal', () => {
    it('should mark deal as won', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.deal.update.mockResolvedValue({
        ...mockDealWithRelations,
        status: DealStatus.SUCCESS,
        closedAt: expect.any(Date),
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.closeDeal('deal-123', true, mockUserId, mockOrgId);

      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-123' },
        data: {
          status: DealStatus.SUCCESS,
          closedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should mark deal as lost', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.deal.update.mockResolvedValue({
        ...mockDealWithRelations,
        status: DealStatus.LOST,
        closedAt: expect.any(Date),
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.closeDeal('deal-123', false, mockUserId, mockOrgId);

      expect(mockPrismaService.deal.update).toHaveBeenCalledWith({
        where: { id: 'deal-123' },
        data: {
          status: DealStatus.LOST,
          closedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.closeDeal('unknown', true, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDealsByStage', () => {
    it('should return deals grouped by stages', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([mockDealWithRelations]);

      const result = await service.getDealsByStage('pipeline-123', mockOrgId);

      expect(result.pipeline).toEqual(mockPipeline);
      expect(result.stages).toHaveLength(3);
      expect(result.stages[0]).toHaveProperty('deals');
      expect(result.stages[0]).toHaveProperty('dealsCount');
      expect(result.stages[0]).toHaveProperty('totalAmount');
    });

    it('should throw NotFoundException when pipeline not found', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(null);

      await expect(
        service.getDealsByStage('unknown', mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate totalAmount correctly', async () => {
      const dealsInStage = [
        { ...mockDealWithRelations, amount: 50000 },
        { ...mockDealWithRelations, amount: 30000 },
      ];
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue(dealsInStage);

      const result = await service.getDealsByStage('pipeline-123', mockOrgId);

      expect(result.stages[0].totalAmount).toBe(80000);
    });
  });

  describe('duplicateDeal', () => {
    it('should duplicate deal successfully', async () => {
      const newDeal = {
        ...mockDealWithRelations,
        id: 'deal-456',
        title: 'Тестовая сделка (копия)',
        status: DealStatus.NEW,
      };
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.deal.create.mockResolvedValue(newDeal);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.duplicateDeal('deal-123', mockUserId, mockOrgId);

      expect(result.title).toContain('(копия)');
      expect(result.status).toBe(DealStatus.NEW);
    });

    it('should copy products when duplicating', async () => {
      const dealWithProducts = {
        ...mockDealWithRelations,
        products: [
          { productId: 'prod-1', quantity: 2, price: 10000, discount: 0 },
        ],
      };
      mockPrismaService.deal.findFirst.mockResolvedValue(dealWithProducts);
      mockPrismaService.deal.create.mockResolvedValue({
        ...mockDealWithRelations,
        id: 'deal-456',
      });
      mockPrismaService.dealProduct.createMany.mockResolvedValue({ count: 1 });
      mockPrismaService.activity.create.mockResolvedValue({});

      await service.duplicateDeal('deal-123', mockUserId, mockOrgId);

      expect(mockPrismaService.dealProduct.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(
        service.duplicateDeal('unknown', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDealStats', () => {
    it('should return deal statistics', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.task.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);
      mockPrismaService.activity.count.mockResolvedValue(20);
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.getDealStats('deal-123', mockOrgId);

      expect(result.stats.tasksCount).toBe(10);
      expect(result.stats.completedTasksCount).toBe(5);
      expect(result.stats.taskCompletionRate).toBe(50);
      expect(result.stats.activitiesCount).toBe(20);
      expect(result.stats.daysInPipeline).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero tasks', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(mockDealWithRelations);
      mockPrismaService.task.count.mockResolvedValue(0);
      mockPrismaService.activity.count.mockResolvedValue(0);
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.getDealStats('deal-123', mockOrgId);

      expect(result.stats.taskCompletionRate).toBe(0);
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue(null);

      await expect(service.getDealStats('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
