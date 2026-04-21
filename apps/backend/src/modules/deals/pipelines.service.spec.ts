import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PipelinesService', () => {
  let service: PipelinesService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockPipelineId = 'pipeline-123';
  const mockStageId = 'stage-123';

  const mockPipeline = {
    id: mockPipelineId,
    name: 'Sales Pipeline',
    description: 'Main sales pipeline',
    isDefault: true,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    stages: [
      { id: 'stage-1', name: 'New', color: '#3B82F6', order: 0, _count: { deals: 5 } },
      { id: 'stage-2', name: 'Qualified', color: '#8B5CF6', order: 1, _count: { deals: 3 } },
      { id: 'stage-3', name: 'Proposal', color: '#EC4899', order: 2, _count: { deals: 2 } },
    ],
    _count: { stages: 3 },
  };

  const mockPrismaService = {
    pipeline: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    deal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelinesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PipelinesService>(PipelinesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a pipeline with default stages', async () => {
      mockPrismaService.pipeline.count.mockResolvedValue(0);
      mockPrismaService.pipeline.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.pipeline.create.mockResolvedValue(mockPipeline);

      const createDto = { name: 'New Pipeline' };
      const result = await service.create(mockOrganizationId, createDto as any);

      expect(mockPrismaService.pipeline.create).toHaveBeenCalled();
      expect(result).toEqual(mockPipeline);
    });

    it('should make first pipeline default', async () => {
      mockPrismaService.pipeline.count.mockResolvedValue(0);
      mockPrismaService.pipeline.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.pipeline.create.mockResolvedValue(mockPipeline);

      await service.create(mockOrganizationId, { name: 'First Pipeline' } as any);

      expect(mockPrismaService.pipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDefault: true,
          }),
        }),
      );
    });

    it('should create pipeline with custom stages', async () => {
      mockPrismaService.pipeline.count.mockResolvedValue(1);
      mockPrismaService.pipeline.create.mockResolvedValue(mockPipeline);

      const createDto = {
        name: 'Custom Pipeline',
        stages: [
          { name: 'Stage 1', color: '#FF0000' },
          { name: 'Stage 2', color: '#00FF00' },
        ],
      };

      await service.create(mockOrganizationId, createDto as any);

      expect(mockPrismaService.pipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stages: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: 'Stage 1', color: '#FF0000', order: 0 }),
                expect.objectContaining({ name: 'Stage 2', color: '#00FF00', order: 1 }),
              ]),
            }),
          }),
        }),
      );
    });

    it('should reset other pipelines default flag when creating default', async () => {
      mockPrismaService.pipeline.count.mockResolvedValue(1);
      mockPrismaService.pipeline.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.pipeline.create.mockResolvedValue(mockPipeline);

      await service.create(mockOrganizationId, { name: 'New Default', isDefault: true } as any);

      expect(mockPrismaService.pipeline.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, organizationId: mockOrganizationId },
        data: { isDefault: false },
      });
    });
  });

  describe('findAll', () => {
    it('should return all pipelines with stats', async () => {
      mockPrismaService.pipeline.findMany.mockResolvedValue([mockPipeline]);
      mockPrismaService.deal.findMany.mockResolvedValue([
        { amount: 10000, status: 'SUCCESS' },
        { amount: 5000, status: 'NEW' },
        { amount: 3000, status: 'LOST' },
      ]);

      const result = await service.findAll(mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('stats');
      expect(result[0].stats).toHaveProperty('totalDeals');
      expect(result[0].stats).toHaveProperty('wonDeals');
      expect(result[0].stats).toHaveProperty('lostDeals');
      expect(result[0].stats).toHaveProperty('conversionRate');
      expect(result[0].stats).toHaveProperty('totalAmount');
      expect(result[0].stats).toHaveProperty('wonAmount');
    });

    it('should calculate stats correctly', async () => {
      mockPrismaService.pipeline.findMany.mockResolvedValue([mockPipeline]);
      mockPrismaService.deal.findMany.mockResolvedValue([
        { amount: 10000, status: 'SUCCESS' },
        { amount: 5000, status: 'SUCCESS' },
        { amount: 3000, status: 'NEW' },
        { amount: 2000, status: 'LOST' },
      ]);

      const result = await service.findAll(mockOrganizationId);

      expect(result[0].stats.totalDeals).toBe(4);
      expect(result[0].stats.wonDeals).toBe(2);
      expect(result[0].stats.lostDeals).toBe(1);
      expect(result[0].stats.conversionRate).toBe(50); // 2/4 * 100
      expect(result[0].stats.totalAmount).toBe(20000);
      expect(result[0].stats.wonAmount).toBe(15000);
    });
  });

  describe('findOne', () => {
    it('should return a pipeline with stage stats', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([{ amount: 5000 }]);

      const result = await service.findOne(mockOrganizationId, mockPipelineId);

      expect(mockPrismaService.pipeline.findFirst).toHaveBeenCalledWith({
        where: { id: mockPipelineId, organizationId: mockOrganizationId },
        include: expect.any(Object),
      });
      expect(result.stages[0]).toHaveProperty('totalAmount');
      expect(result.stages[0]).toHaveProperty('dealsCount');
    });

    it('should throw NotFoundException if pipeline not found', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockOrganizationId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a pipeline', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.pipeline.update.mockResolvedValue({
        ...mockPipeline,
        name: 'Updated Pipeline',
      });

      const result = await service.update(
        mockOrganizationId,
        mockPipelineId,
        { name: 'Updated Pipeline' } as any,
      );

      expect(result.name).toBe('Updated Pipeline');
    });

    it('should reset other defaults when setting as default', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.pipeline.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.pipeline.update.mockResolvedValue(mockPipeline);

      await service.update(mockOrganizationId, mockPipelineId, { isDefault: true } as any);

      expect(mockPrismaService.pipeline.updateMany).toHaveBeenCalledWith({
        where: {
          isDefault: true,
          id: { not: mockPipelineId },
          organizationId: mockOrganizationId,
        },
        data: { isDefault: false },
      });
    });
  });

  describe('remove', () => {
    it('should delete a pipeline', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue({ ...mockPipeline, isDefault: false });
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.pipeline.count.mockResolvedValue(2);
      mockPrismaService.pipeline.delete.mockResolvedValue(mockPipeline);

      const result = await service.remove(mockOrganizationId, mockPipelineId);

      expect(result.message).toContain('успешно удалена');
    });

    it('should throw error if pipeline has deals', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(5);

      await expect(service.remove(mockOrganizationId, mockPipelineId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if trying to delete last pipeline', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.pipeline.count.mockResolvedValue(1);

      await expect(service.remove(mockOrganizationId, mockPipelineId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set another pipeline as default when deleting default', async () => {
      mockPrismaService.pipeline.findFirst
        .mockResolvedValueOnce(mockPipeline) // findOne call
        .mockResolvedValueOnce({ id: 'another-pipeline' }); // Finding next default
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.pipeline.count.mockResolvedValue(2);
      mockPrismaService.pipeline.delete.mockResolvedValue(mockPipeline);
      mockPrismaService.pipeline.update.mockResolvedValue({});

      await service.remove(mockOrganizationId, mockPipelineId);

      expect(mockPrismaService.pipeline.update).toHaveBeenCalledWith({
        where: { id: 'another-pipeline' },
        data: { isDefault: true },
      });
    });
  });

  describe('createStage', () => {
    it('should create a new stage', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.stage.create.mockResolvedValue({
        id: 'new-stage',
        name: 'New Stage',
        order: 3,
      });

      const result = await service.createStage(mockOrganizationId, mockPipelineId, {
        name: 'New Stage',
      } as any);

      expect(result.name).toBe('New Stage');
    });

    it('should assign correct order to new stage', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.stage.create.mockResolvedValue({ id: 'new-stage', order: 3 });

      await service.createStage(mockOrganizationId, mockPipelineId, { name: 'New Stage' } as any);

      expect(mockPrismaService.stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 3,
          }),
        }),
      );
    });

    it('should shift existing stages when inserting at specific position', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.stage.create.mockResolvedValue({ id: 'new-stage', order: 1 });
      mockPrismaService.stage.updateMany.mockResolvedValue({ count: 2 });

      await service.createStage(mockOrganizationId, mockPipelineId, {
        name: 'Inserted Stage',
        order: 1,
      } as any);

      expect(mockPrismaService.stage.updateMany).toHaveBeenCalled();
    });
  });

  describe('updateStage', () => {
    it('should update a stage', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        name: 'Old Name',
        order: 1,
        pipelineId: mockPipelineId,
        pipeline: mockPipeline,
      });
      mockPrismaService.stage.update.mockResolvedValue({
        id: mockStageId,
        name: 'New Name',
      });

      const result = await service.updateStage(mockOrganizationId, mockStageId, {
        name: 'New Name',
      } as any);

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException if stage not found', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStage(mockOrganizationId, 'non-existent', { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reorder stages when changing order', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        name: 'Stage',
        order: 0,
        pipelineId: mockPipelineId,
        pipeline: mockPipeline,
      });
      mockPrismaService.stage.findMany.mockResolvedValue(mockPipeline.stages);
      mockPrismaService.stage.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.stage.update.mockResolvedValue({ id: mockStageId, order: 2 });

      await service.updateStage(mockOrganizationId, mockStageId, { order: 2 } as any);

      expect(mockPrismaService.stage.updateMany).toHaveBeenCalled();
    });
  });

  describe('removeStage', () => {
    it('should remove a stage', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        order: 1,
        pipelineId: mockPipelineId,
        pipeline: { ...mockPipeline, stages: mockPipeline.stages },
      });
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.stage.delete.mockResolvedValue({ id: mockStageId });
      mockPrismaService.stage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removeStage(mockOrganizationId, mockStageId);

      expect(result.message).toContain('успешно удален');
    });

    it('should throw error if stage has deals', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        pipelineId: mockPipelineId,
        pipeline: mockPipeline,
      });
      mockPrismaService.deal.count.mockResolvedValue(5);

      await expect(service.removeStage(mockOrganizationId, mockStageId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if deleting last stage', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        pipelineId: mockPipelineId,
        pipeline: { ...mockPipeline, stages: [{ id: mockStageId }] },
      });
      mockPrismaService.deal.count.mockResolvedValue(0);

      await expect(service.removeStage(mockOrganizationId, mockStageId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reorder remaining stages after deletion', async () => {
      mockPrismaService.stage.findFirst.mockResolvedValue({
        id: mockStageId,
        order: 1,
        pipelineId: mockPipelineId,
        pipeline: { ...mockPipeline, stages: mockPipeline.stages },
      });
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.stage.delete.mockResolvedValue({ id: mockStageId });
      mockPrismaService.stage.updateMany.mockResolvedValue({ count: 1 });

      await service.removeStage(mockOrganizationId, mockStageId);

      expect(mockPrismaService.stage.updateMany).toHaveBeenCalledWith({
        where: {
          pipelineId: mockPipelineId,
          order: { gt: 1 },
        },
        data: {
          order: { decrement: 1 },
        },
      });
    });
  });

  describe('reorderStages', () => {
    it('should reorder stages', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.stage.update.mockResolvedValue({});

      const stageIds = ['stage-3', 'stage-1', 'stage-2'];
      await service.reorderStages(mockOrganizationId, mockPipelineId, stageIds);

      expect(mockPrismaService.stage.update).toHaveBeenCalledTimes(3);
    });

    it('should throw error for invalid stage list', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);

      const invalidStageIds = ['stage-1', 'invalid-id'];
      await expect(
        service.reorderStages(mockOrganizationId, mockPipelineId, invalidStageIds),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if not all stages included', async () => {
      mockPrismaService.pipeline.findFirst.mockResolvedValue(mockPipeline);
      mockPrismaService.deal.findMany.mockResolvedValue([]);

      const incompleteStageIds = ['stage-1', 'stage-2']; // Missing stage-3
      await expect(
        service.reorderStages(mockOrganizationId, mockPipelineId, incompleteStageIds),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
