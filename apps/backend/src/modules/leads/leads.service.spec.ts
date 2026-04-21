import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { LeadSource, LeadStatus } from '@prisma/client';

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockLead = {
    id: 'lead-123',
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+79991234567',
    company: 'Тестовая компания',
    source: 'WEBSITE',
    status: 'NEW',
    description: 'Описание лида',
    ownerId: mockUserId,
    createdById: mockUserId,
    organizationId: mockOrgId,
    convertedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLeadWithRelations = {
    ...mockLead,
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
  };

  const mockPrismaService = {
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    contact: {
      create: jest.fn(),
    },
    deal: {
      create: jest.fn(),
    },
  };

  const mockAutomationService = {
    executeByTrigger: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Новый лид',
      email: 'new@example.com',
      phone: '+79991234568',
      source: LeadSource.CALL,
    };

    it('should create a lead successfully', async () => {
      mockPrismaService.lead.create.mockResolvedValue(mockLeadWithRelations);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toEqual(mockLeadWithRelations);
      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          email: createDto.email,
          ownerId: mockUserId,
          createdById: mockUserId,
          organizationId: mockOrgId,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated leads', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([mockLeadWithRelations]);
      mockPrismaService.lead.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockOrgId);

      expect(result).toEqual({
        items: [mockLeadWithRelations],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValue(0);

      await service.findAll({ search: 'Иван' }, mockOrgId);

      expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by source', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValue(0);

      await service.findAll({ source: LeadSource.WEBSITE }, mockOrgId);

      expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: LeadSource.WEBSITE,
          }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValue(0);

      await service.findAll({ status: LeadStatus.NEW }, mockOrgId);

      expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: LeadStatus.NEW,
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValue(50);

      const result = await service.findAll({ skip: 20, take: 10 }, mockOrgId);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });

    it('should apply sorting', async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'name', sortOrder: 'asc' }, mockOrgId);

      expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a lead by id', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeadWithRelations);

      const result = await service.findOne('lead-123', mockOrgId);

      expect(result).toEqual(mockLeadWithRelations);
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Обновленный лид',
      status: LeadStatus.IN_PROGRESS,
    };

    it('should update lead successfully', async () => {
      const updatedLead = { ...mockLeadWithRelations, ...updateDto };
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeadWithRelations);
      mockPrismaService.lead.update.mockResolvedValue(updatedLead);

      const result = await service.update('lead-123', updateDto, mockOrgId);

      expect(result.name).toBe('Обновленный лид');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown', updateDto, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete lead successfully', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLead);
      mockPrismaService.lead.delete.mockResolvedValue(mockLead);

      const result = await service.remove('lead-123', mockOrgId);

      expect(result).toEqual({ message: 'Лид успешно удален' });
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await expect(service.remove('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('convert', () => {
    const mockContact = {
      id: 'contact-123',
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@example.com',
    };

    it('should convert lead to contact', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeadWithRelations);
      mockPrismaService.contact.create.mockResolvedValue(mockContact);
      mockPrismaService.lead.update.mockResolvedValue({
        ...mockLeadWithRelations,
        status: 'CONVERTED',
        convertedAt: new Date(),
      });

      const result = await service.convert('lead-123', {}, mockUserId, mockOrgId);

      expect(result.message).toBe('Лид успешно конвертирован');
      expect(result.contact).toBeDefined();
      expect(result.deal).toBeNull();
      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Иван',
          email: mockLead.email,
          phone: mockLead.phone,
        }),
      });
    });

    it('should convert lead to contact with deal', async () => {
      const mockDeal = {
        id: 'deal-123',
        title: 'Сделка от лида: Иван Иванов',
        amount: 50000,
      };

      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeadWithRelations);
      mockPrismaService.contact.create.mockResolvedValue(mockContact);
      mockPrismaService.lead.update.mockResolvedValue({
        ...mockLeadWithRelations,
        status: 'CONVERTED',
      });
      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      const result = await service.convert(
        'lead-123',
        {
          createDeal: true,
          stageId: 'stage-123',
          dealTitle: 'Сделка от лида: Иван Иванов',
          dealAmount: 50000,
        },
        mockUserId,
        mockOrgId
      );

      expect(result.contact).toBeDefined();
      expect(result.deal).toBeDefined();
      expect(mockPrismaService.deal.create).toHaveBeenCalled();
    });

    it('should convert lead to contact with company', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(mockLeadWithRelations);
      mockPrismaService.contact.create.mockResolvedValue(mockContact);
      mockPrismaService.lead.update.mockResolvedValue({
        ...mockLeadWithRelations,
        status: 'CONVERTED',
      });

      await service.convert(
        'lead-123',
        { companyId: 'company-123' },
        mockUserId,
        mockOrgId
      );

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'company-123',
        }),
      });
    });

    it('should throw NotFoundException when lead not found', async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await expect(
        service.convert('unknown', {}, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should split name correctly for contact', async () => {
      const leadWithFullName = {
        ...mockLeadWithRelations,
        name: 'Иван Петрович Сидоров',
      };
      mockPrismaService.lead.findFirst.mockResolvedValue(leadWithFullName);
      mockPrismaService.contact.create.mockResolvedValue(mockContact);
      mockPrismaService.lead.update.mockResolvedValue({
        ...leadWithFullName,
        status: 'CONVERTED',
      });

      await service.convert('lead-123', {}, mockUserId, mockOrgId);

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Иван',
          lastName: 'Петрович Сидоров',
        }),
      });
    });
  });

  describe('getStats', () => {
    it('should return lead statistics', async () => {
      mockPrismaService.lead.count.mockResolvedValue(100);
      mockPrismaService.lead.groupBy
        .mockResolvedValueOnce([
          { status: 'NEW', _count: 50 },
          { status: 'IN_PROGRESS', _count: 30 },
          { status: 'CONVERTED', _count: 20 },
        ])
        .mockResolvedValueOnce([
          { source: 'WEBSITE', _count: 60 },
          { source: 'CALL', _count: 40 },
        ]);

      const result = await service.getStats(mockOrgId);

      expect(result.total).toBe(100);
      expect(result.byStatus).toEqual({
        NEW: 50,
        IN_PROGRESS: 30,
        CONVERTED: 20,
      });
      expect(result.bySource).toEqual({
        WEBSITE: 60,
        CALL: 40,
      });
    });

    it('should handle empty stats', async () => {
      mockPrismaService.lead.count.mockResolvedValue(0);
      mockPrismaService.lead.groupBy.mockResolvedValue([]);

      const result = await service.getStats(mockOrgId);

      expect(result.total).toBe(0);
      expect(result.byStatus).toEqual({});
      expect(result.bySource).toEqual({});
    });
  });
});
