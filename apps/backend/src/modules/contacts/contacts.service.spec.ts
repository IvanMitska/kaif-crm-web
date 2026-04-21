import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { ContactSource } from '@prisma/client';

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockContact = {
    id: 'contact-123',
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: 'Иванович',
    email: 'ivan@example.com',
    phone: '+79991234567',
    secondPhone: null,
    position: 'Менеджер',
    birthDate: null,
    source: ContactSource.WEBSITE,
    description: 'Тестовый контакт',
    companyId: null,
    ownerId: mockUserId,
    createdById: mockUserId,
    organizationId: mockOrgId,
    customFields: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContactWithRelations = {
    ...mockContact,
    company: null,
    tags: [],
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
    deals: [],
    tasks: [],
    activities: [],
    messages: [],
  };

  const mockPrismaService = {
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    message: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockAutomationService = {
    executeByTrigger: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@example.com',
      phone: '+79991234567',
      source: ContactSource.WEBSITE,
    };

    it('should create a contact successfully', async () => {
      mockPrismaService.contact.create.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toEqual(mockContactWithRelations);
      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: createDto.firstName,
          lastName: createDto.lastName,
          email: createDto.email,
          ownerId: mockUserId,
          createdById: mockUserId,
          organizationId: mockOrgId,
        }),
        include: expect.any(Object),
      });
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should create contact with tags', async () => {
      const dtoWithTags = { ...createDto, tags: ['tag1', 'tag2'] };
      mockPrismaService.contact.create.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.create(dtoWithTags, mockUserId, mockOrgId);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    const mockContactsList = [mockContactWithRelations];

    it('should return paginated contacts', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue(mockContactsList);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockOrgId);

      expect(result).toEqual({
        data: mockContactsList,
        total: 1,
        skip: 0,
        take: 20,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ search: 'Иван' }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should apply source filter', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ source: ContactSource.WEBSITE }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: ContactSource.WEBSITE,
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(100);

      const result = await service.findAll({ skip: 20, take: 10 }, mockOrgId);

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should apply sorting', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'firstName', sortOrder: 'asc' }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { firstName: 'asc' },
        })
      );
    });

    it('should filter by companyId', async () => {
      const companyId = 'company-123';
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ companyId }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId,
          }),
        })
      );
    });

    it('should filter by ownerId', async () => {
      const ownerId = 'owner-123';
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ ownerId }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId,
          }),
        })
      );
    });

    it('should filter by tagIds', async () => {
      const tagIds = ['tag-1', 'tag-2'];
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.contact.count.mockResolvedValue(0);

      await service.findAll({ tagIds }, mockOrgId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                id: { in: tagIds },
              },
            },
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a contact by id', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);

      const result = await service.findOne('contact-123', mockOrgId);

      expect(result).toEqual(mockContactWithRelations);
      expect(mockPrismaService.contact.findFirst).toHaveBeenCalledWith({
        where: { id: 'contact-123', organizationId: mockOrgId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Петр',
      email: 'petr@example.com',
    };

    it('should update contact successfully', async () => {
      const updatedContact = { ...mockContactWithRelations, ...updateDto };
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.contact.update.mockResolvedValue(updatedContact);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.update('contact-123', updateDto, mockUserId, mockOrgId);

      expect(result.firstName).toBe('Петр');
      expect(result.email).toBe('petr@example.com');
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown', updateDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete contact successfully', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.contact.delete.mockResolvedValue(mockContact);

      const result = await service.remove('contact-123', mockOrgId);

      expect(result).toEqual({ message: 'Контакт успешно удален' });
      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-123' },
      });
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.remove('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('importContacts', () => {
    it('should throw BadRequestException for invalid file', async () => {
      // Mock file with invalid/empty buffer
      const mockFile = {
        buffer: Buffer.from(''),
        originalname: 'test.xlsx',
      } as Express.Multer.File;

      await expect(
        service.importContacts(mockFile, mockUserId, mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportContacts', () => {
    it('should return Buffer for XLSX export', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([mockContact]);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.exportContacts({}, mockOrgId);

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicates by email', async () => {
      const contacts = [
        { id: '1', firstName: 'Иван', lastName: 'Иванов', email: 'ivan@test.com', phone: null },
        { id: '2', firstName: 'Иван', lastName: 'Петров', email: 'ivan@test.com', phone: null },
      ];
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.findDuplicates(mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].matchedBy).toBe('email');
      expect(result[0].original.id).toBe('1');
      expect(result[0].duplicate.id).toBe('2');
    });

    it('should find duplicates by phone', async () => {
      const contacts = [
        { id: '1', firstName: 'Иван', lastName: 'Иванов', email: null, phone: '+79991234567' },
        { id: '2', firstName: 'Петр', lastName: 'Петров', email: null, phone: '+79991234567' },
      ];
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.findDuplicates(mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].matchedBy).toBe('phone');
    });

    it('should return empty array when no duplicates', async () => {
      const contacts = [
        { id: '1', firstName: 'Иван', lastName: 'Иванов', email: 'ivan@test.com', phone: '+79991234567' },
        { id: '2', firstName: 'Петр', lastName: 'Петров', email: 'petr@test.com', phone: '+79991234568' },
      ];
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.findDuplicates(mockOrgId);

      expect(result).toHaveLength(0);
    });

    it('should not match contacts with empty email and phone', async () => {
      const contacts = [
        { id: '1', firstName: 'Иван', lastName: 'Иванов', email: null, phone: null },
        { id: '2', firstName: 'Петр', lastName: 'Петров', email: null, phone: null },
      ];
      mockPrismaService.contact.findMany.mockResolvedValue(contacts);

      const result = await service.findDuplicates(mockOrgId);

      expect(result).toHaveLength(0);
    });
  });

  describe('mergeDuplicates', () => {
    const originalContact = {
      ...mockContactWithRelations,
      id: 'original-123',
      email: 'original@test.com',
      phone: '+79991234567',
      description: 'Оригинальный контакт',
    };

    const duplicateContact = {
      ...mockContactWithRelations,
      id: 'duplicate-123',
      firstName: 'Дубликат',
      email: null,
      phone: null,
      secondPhone: '+79991234568',
      description: 'Дубликат контакта',
    };

    it('should merge contacts successfully', async () => {
      mockPrismaService.contact.findFirst
        .mockResolvedValueOnce(originalContact)
        .mockResolvedValueOnce(duplicateContact);
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.task.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.activity.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.message.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.contact.update.mockResolvedValue(originalContact);
      mockPrismaService.contact.delete.mockResolvedValue(duplicateContact);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.mergeDuplicates(
        'original-123',
        'duplicate-123',
        mockUserId,
        mockOrgId
      );

      expect(result).toEqual({ message: 'Контакты успешно объединены' });
      expect(mockPrismaService.deal.updateMany).toHaveBeenCalledWith({
        where: { contactId: 'duplicate-123' },
        data: { contactId: 'original-123' },
      });
      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({
        where: { id: 'duplicate-123' },
      });
    });

    it('should throw NotFoundException when original not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.mergeDuplicates('unknown', 'duplicate-123', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when duplicate not found', async () => {
      mockPrismaService.contact.findFirst
        .mockResolvedValueOnce(originalContact)
        .mockResolvedValueOnce(null);

      await expect(
        service.mergeDuplicates('original-123', 'unknown', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeOwner', () => {
    const newOwner = {
      id: 'new-owner-123',
      email: 'newowner@example.com',
      firstName: 'Новый',
      lastName: 'Владелец',
    };

    it('should change owner successfully', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.user.findUnique.mockResolvedValue(newOwner);
      mockPrismaService.contact.update.mockResolvedValue({
        ...mockContactWithRelations,
        ownerId: newOwner.id,
        owner: newOwner,
      });
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.changeOwner(
        'contact-123',
        'new-owner-123',
        mockUserId,
        mockOrgId
      );

      expect(result.owner.id).toBe('new-owner-123');
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.changeOwner('unknown', 'new-owner-123', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new owner not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeOwner('contact-123', 'unknown', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getContactStats', () => {
    it('should return contact statistics', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.deal.count.mockResolvedValue(5);
      mockPrismaService.task.count.mockResolvedValue(10);
      mockPrismaService.message.count.mockResolvedValue(20);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { amount: 100000 } });
      mockPrismaService.activity.findFirst.mockResolvedValue({
        createdAt: new Date('2024-01-01'),
      });

      const result = await service.getContactStats('contact-123', mockOrgId);

      expect(result.stats.dealsCount).toBe(5);
      expect(result.stats.tasksCount).toBe(10);
      expect(result.stats.messagesCount).toBe(20);
      expect(result.stats.totalDealsAmount).toBe(100000);
      expect(result.stats.lastActivityDate).toEqual(new Date('2024-01-01'));
      expect(result.stats.daysSinceCreation).toBeGreaterThanOrEqual(0);
    });

    it('should handle null aggregate sum', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContactWithRelations);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.task.count.mockResolvedValue(0);
      mockPrismaService.message.count.mockResolvedValue(0);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { amount: null } });
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const result = await service.getContactStats('contact-123', mockOrgId);

      expect(result.stats.totalDealsAmount).toBe(0);
      expect(result.stats.lastActivityDate).toBeUndefined();
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.getContactStats('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
