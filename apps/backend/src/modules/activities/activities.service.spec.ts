import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockActivityId = 'activity-123';

  const mockActivity = {
    id: mockActivityId,
    type: 'call',
    description: 'Called the client',
    metadata: { duration: 300 },
    contactId: 'contact-123',
    dealId: 'deal-123',
    userId: mockUserId,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: mockUserId,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    contact: {
      id: 'contact-123',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    deal: {
      id: 'deal-123',
      title: 'Big Deal',
    },
  };

  const mockPrismaService = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an activity', async () => {
      const createDto = {
        type: 'email',
        description: 'Sent proposal email',
        contactId: 'contact-123',
      };

      mockPrismaService.activity.create.mockResolvedValue({
        ...mockActivity,
        ...createDto,
        type: 'email',
      });

      const result = await service.create(createDto as any, mockUserId, mockOrganizationId);

      expect(mockPrismaService.activity.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: mockUserId,
          organizationId: mockOrganizationId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          contact: true,
          deal: true,
        },
      });
      expect(result.type).toBe('email');
    });

    it('should create activity with deal', async () => {
      const createDto = {
        type: 'meeting',
        description: 'Client meeting',
        dealId: 'deal-123',
      };

      mockPrismaService.activity.create.mockResolvedValue({
        ...mockActivity,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockUserId, mockOrganizationId);

      expect(result.dealId).toBe('deal-123');
    });

    it('should create activity with metadata', async () => {
      const createDto = {
        type: 'call',
        description: 'Sales call',
        metadata: { duration: 600, outcome: 'successful' },
      };

      mockPrismaService.activity.create.mockResolvedValue({
        ...mockActivity,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockUserId, mockOrganizationId);

      expect(result.metadata).toEqual({ duration: 600, outcome: 'successful' });
    });
  });

  describe('findAll', () => {
    it('should return all activities for organization', async () => {
      const activities = [mockActivity, { ...mockActivity, id: 'activity-2' }];
      mockPrismaService.activity.findMany.mockResolvedValue(activities);

      const result = await service.findAll({}, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: mockOrganizationId },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by contactId', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([mockActivity]);

      await service.findAll({ contactId: 'contact-123' }, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contactId: 'contact-123',
          }),
        }),
      );
    });

    it('should filter by dealId', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([mockActivity]);

      await service.findAll({ dealId: 'deal-123' }, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dealId: 'deal-123',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([mockActivity]);

      await service.findAll({ type: 'call' }, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'call',
          }),
        }),
      );
    });

    it('should support pagination with skip and take', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll({ skip: 10, take: 20 }, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        }),
      );
    });

    it('should use default pagination values', async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      await service.findAll({}, mockOrganizationId);

      expect(mockPrismaService.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single activity', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findOne(mockActivityId, mockOrganizationId);

      expect(mockPrismaService.activity.findFirst).toHaveBeenCalledWith({
        where: { id: mockActivityId, organizationId: mockOrganizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          contact: true,
          deal: true,
        },
      });
      expect(result).toEqual(mockActivity);
    });

    it('should return null if activity not found', async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const result = await service.findOne('non-existent', mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an activity', async () => {
      const updateDto = { description: 'Updated description' };
      mockPrismaService.activity.update.mockResolvedValue({
        ...mockActivity,
        ...updateDto,
      });

      const result = await service.update(mockActivityId, updateDto as any, mockOrganizationId);

      expect(mockPrismaService.activity.update).toHaveBeenCalledWith({
        where: { id: mockActivityId },
        data: updateDto,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          contact: true,
          deal: true,
        },
      });
      expect(result.description).toBe('Updated description');
    });

    it('should update activity type', async () => {
      const updateDto = { type: 'meeting' };
      mockPrismaService.activity.update.mockResolvedValue({
        ...mockActivity,
        ...updateDto,
      });

      const result = await service.update(mockActivityId, updateDto as any, mockOrganizationId);

      expect(result.type).toBe('meeting');
    });

    it('should update activity metadata', async () => {
      const updateDto = { metadata: { notes: 'Important client' } };
      mockPrismaService.activity.update.mockResolvedValue({
        ...mockActivity,
        ...updateDto,
      });

      const result = await service.update(mockActivityId, updateDto as any, mockOrganizationId);

      expect(result.metadata).toEqual({ notes: 'Important client' });
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      mockPrismaService.activity.delete.mockResolvedValue(mockActivity);

      const result = await service.remove(mockActivityId, mockOrganizationId);

      expect(mockPrismaService.activity.delete).toHaveBeenCalledWith({
        where: { id: mockActivityId },
      });
      expect(result).toEqual(mockActivity);
    });
  });
});
