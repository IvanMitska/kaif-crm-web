import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';

  const mockPrismaService = {
    contact: {
      count: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    company: {
      count: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    stage: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    beforeEach(() => {
      // Setup default mocks for all Promise.all calls
      mockPrismaService.contact.count.mockResolvedValue(100);
      mockPrismaService.deal.count.mockResolvedValue(50);
      mockPrismaService.task.count.mockResolvedValue(200);
      mockPrismaService.company.count.mockResolvedValue(25);
      mockPrismaService.deal.findMany.mockResolvedValue([
        { amount: 10000 },
        { amount: 20000 },
        { amount: 15000 },
      ]);
      mockPrismaService.activity.findMany.mockResolvedValue([
        { id: 'act-1', type: 'call', user: { firstName: 'John', lastName: 'Doe' } },
      ]);
      mockPrismaService.stage.findMany.mockResolvedValue([
        {
          id: 'stage-1',
          name: 'New',
          color: '#blue',
          deals: [{ amount: 5000 }, { amount: 3000 }],
        },
        {
          id: 'stage-2',
          name: 'Negotiation',
          color: '#yellow',
          deals: [{ amount: 10000 }],
        },
      ]);
    });

    it('should return dashboard stats without userId filter', async () => {
      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('totalContacts');
      expect(result).toHaveProperty('totalDeals');
      expect(result).toHaveProperty('totalTasks');
      expect(result).toHaveProperty('totalCompanies');
      expect(result).toHaveProperty('activeDeals');
      expect(result).toHaveProperty('totalDealsAmount');
      expect(result).toHaveProperty('pendingTasks');
      expect(result).toHaveProperty('todayTasks');
      expect(result).toHaveProperty('highPriorityTasks');
      expect(result).toHaveProperty('recentContacts');
      expect(result).toHaveProperty('dealsAddedToday');
      expect(result).toHaveProperty('recentActivities');
      expect(result).toHaveProperty('funnel');
    });

    it('should return dashboard stats with userId filter', async () => {
      const result = await service.getDashboardStats(mockUserId);

      expect(mockPrismaService.contact.count).toHaveBeenCalledWith({ where: { ownerId: mockUserId } });
      expect(mockPrismaService.deal.count).toHaveBeenCalled();
      expect(mockPrismaService.task.count).toHaveBeenCalledWith({ where: { assigneeId: mockUserId } });
    });

    it('should calculate total deals amount correctly', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([
        { amount: 10000 },
        { amount: 20000 },
        { amount: 15000 },
      ]);

      const result = await service.getDashboardStats();

      expect(result.totalDealsAmount).toBe(45000);
    });

    it('should return funnel data', async () => {
      const result = await service.getDashboardStats();

      expect(result.funnel).toHaveLength(2);
      expect(result.funnel[0]).toHaveProperty('name', 'New');
      expect(result.funnel[0]).toHaveProperty('dealsCount');
      expect(result.funnel[0]).toHaveProperty('totalAmount');
    });

    it('should handle zero deals', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result.totalDealsAmount).toBe(0);
    });
  });

  describe('getTodayTasks', () => {
    it('should return today tasks without userId', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Call client',
          status: 'PENDING',
          dueDate: new Date(),
          contact: { firstName: 'John', lastName: 'Doe' },
          deal: { title: 'Big deal' },
        },
      ];
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTodayTasks();

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date),
            }),
          }),
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
      );
      expect(result).toEqual(mockTasks);
    });

    it('should return today tasks with userId filter', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getTodayTasks(mockUserId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: mockUserId,
          }),
        }),
      );
    });

    it('should include contact and deal info', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.getTodayTasks();

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            contact: { select: { firstName: true, lastName: true } },
            deal: { select: { title: true } },
          },
        }),
      );
    });
  });

  describe('getSalesAnalytics', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('should return sales analytics for date range', async () => {
      const mockDeals = [
        { amount: 10000, stage: { name: 'New' } },
        { amount: 20000, stage: { name: 'New' } },
        { amount: 15000, stage: { name: 'Negotiation' } },
      ];
      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getSalesAnalytics(startDate, endDate);

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          stage: true,
        },
      });
      expect(result.totalDeals).toBe(3);
      expect(result.totalAmount).toBe(45000);
      expect(result.averageAmount).toBe(15000);
      expect(result.dealsByStage).toEqual({
        New: 2,
        Negotiation: 1,
      });
    });

    it('should handle empty deals', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);

      const result = await service.getSalesAnalytics(startDate, endDate);

      expect(result.totalDeals).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.averageAmount).toBe(0);
      expect(result.dealsByStage).toEqual({});
    });

    it('should calculate average amount correctly', async () => {
      const mockDeals = [
        { amount: 100, stage: { name: 'Stage1' } },
        { amount: 200, stage: { name: 'Stage1' } },
        { amount: 300, stage: { name: 'Stage1' } },
      ];
      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.getSalesAnalytics(startDate, endDate);

      expect(result.averageAmount).toBe(200);
    });
  });

  describe('getActivityAnalytics', () => {
    it('should return activity analytics without userId', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockActivities = [
        { id: 'act-1', type: 'call', createdAt: today },
        { id: 'act-2', type: 'call', createdAt: today },
        { id: 'act-3', type: 'email', createdAt: yesterday },
      ];
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);

      const result = await service.getActivityAnalytics();

      expect(result.total).toBe(3);
      expect(result.byType).toEqual({
        call: 2,
        email: 1,
      });
      expect(result.byDay).toBeDefined();
    });

    it('should return activity analytics with userId filter', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.getActivityAnalytics(mockUserId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
          }),
        }),
      );
    });

    it('should filter by custom number of days', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.getActivityAnalytics(undefined, 7);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should group activities by day', async () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T14:00:00Z');
      const date3 = new Date('2024-01-16T10:00:00Z');

      const mockActivities = [
        { id: 'act-1', type: 'call', createdAt: date1 },
        { id: 'act-2', type: 'email', createdAt: date2 },
        { id: 'act-3', type: 'call', createdAt: date3 },
      ];
      mockPrismaService.activity.findMany.mockResolvedValue(mockActivities);

      const result = await service.getActivityAnalytics();

      expect(result.byDay['2024-01-15']).toBe(2);
      expect(result.byDay['2024-01-16']).toBe(1);
    });

    it('should handle no activities', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      const result = await service.getActivityAnalytics();

      expect(result.total).toBe(0);
      expect(result.byType).toEqual({});
      expect(result.byDay).toEqual({});
    });
  });

  describe('getConversionFunnel', () => {
    it('should return conversion funnel data', async () => {
      const mockStages = [
        {
          id: 'stage-1',
          name: 'New',
          color: '#3498db',
          order: 1,
          deals: [
            { amount: 10000 },
            { amount: 5000 },
          ],
        },
        {
          id: 'stage-2',
          name: 'Qualified',
          color: '#2ecc71',
          order: 2,
          deals: [
            { amount: 20000 },
          ],
        },
        {
          id: 'stage-3',
          name: 'Closed',
          color: '#9b59b6',
          order: 3,
          deals: [],
        },
      ];
      mockPrismaService.stage.findMany.mockResolvedValue(mockStages);

      const result = await service.getConversionFunnel();

      expect(mockPrismaService.stage.findMany).toHaveBeenCalledWith({
        include: {
          deals: true,
        },
        orderBy: {
          order: 'asc',
        },
      });
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'stage-1',
        name: 'New',
        color: '#3498db',
        dealsCount: 2,
        totalAmount: 15000,
      });
      expect(result[1]).toEqual({
        id: 'stage-2',
        name: 'Qualified',
        color: '#2ecc71',
        dealsCount: 1,
        totalAmount: 20000,
      });
      expect(result[2]).toEqual({
        id: 'stage-3',
        name: 'Closed',
        color: '#9b59b6',
        dealsCount: 0,
        totalAmount: 0,
      });
    });

    it('should handle empty stages', async () => {
      mockPrismaService.stage.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel();

      expect(result).toEqual([]);
    });

    it('should calculate total amount for each stage', async () => {
      const mockStages = [
        {
          id: 'stage-1',
          name: 'New',
          color: '#blue',
          deals: [
            { amount: 100 },
            { amount: 200 },
            { amount: 300 },
          ],
        },
      ];
      mockPrismaService.stage.findMany.mockResolvedValue(mockStages);

      const result = await service.getConversionFunnel();

      expect(result[0].totalAmount).toBe(600);
      expect(result[0].dealsCount).toBe(3);
    });
  });
});
