import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockCompany = {
    id: 'company-123',
    name: 'Тестовая компания',
    inn: '1234567890',
    kpp: '123456789',
    ogrn: '1234567890123',
    website: 'https://test.ru',
    email: 'info@test.ru',
    phone: '+79991234567',
    address: 'Москва, ул. Тестовая, 1',
    description: 'Описание компании',
    industry: 'IT',
    size: 'MEDIUM',
    ownerId: mockUserId,
    createdById: mockUserId,
    organizationId: mockOrgId,
    customFields: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompanyWithRelations = {
    ...mockCompany,
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
    _count: {
      contacts: 5,
      deals: 3,
    },
    contacts: [],
    deals: [],
  };

  const mockPrismaService = {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Новая компания',
      inn: '0987654321',
      email: 'new@company.ru',
    };

    it('should create a company successfully', async () => {
      mockPrismaService.company.create.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toEqual(mockCompanyWithRelations);
      expect(mockPrismaService.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          inn: createDto.inn,
          ownerId: mockUserId,
          createdById: mockUserId,
          organizationId: mockOrgId,
        }),
        include: expect.any(Object),
      });
    });

    it('should create company with tags', async () => {
      const dtoWithTags = { ...createDto, tags: ['tag1', 'tag2'] };
      mockPrismaService.company.create.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await service.create(dtoWithTags, mockUserId, mockOrgId);

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([mockCompanyWithRelations]);
      mockPrismaService.company.count.mockResolvedValue(1);

      const result = await service.findAll({}, mockOrgId);

      expect(result).toEqual({
        data: [mockCompanyWithRelations],
        total: 1,
        skip: 0,
        take: 20,
      });
    });

    it('should apply search filter', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ search: 'тест' }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by industry', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ industry: 'IT' }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            industry: 'IT',
          }),
        })
      );
    });

    it('should filter by size', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ size: 'LARGE' }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            size: 'LARGE',
          }),
        })
      );
    });

    it('should filter by ownerId', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ ownerId: 'user-456' }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: 'user-456',
          }),
        })
      );
    });

    it('should filter by tagIds', async () => {
      const tagIds = ['tag-1', 'tag-2'];
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ tagIds }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
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

    it('should apply pagination', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(100);

      const result = await service.findAll({ skip: 20, take: 10 }, mockOrgId);

      expect(result.skip).toBe(20);
      expect(result.take).toBe(10);
    });

    it('should apply sorting', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([]);
      mockPrismaService.company.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'name', sortOrder: 'asc' }, mockOrgId);

      expect(mockPrismaService.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a company by id', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);

      const result = await service.findOne('company-123', mockOrgId);

      expect(result).toEqual(mockCompanyWithRelations);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Обновленная компания',
      website: 'https://updated.ru',
    };

    it('should update company successfully', async () => {
      const updatedCompany = { ...mockCompanyWithRelations, ...updateDto };
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.company.update.mockResolvedValue(updatedCompany);
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await service.update('company-123', updateDto, mockUserId, mockOrgId);

      expect(result.name).toBe('Обновленная компания');
      expect(result.website).toBe('https://updated.ru');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(
        service.update('unknown', updateDto, mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete company successfully when no related records', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.contact.count.mockResolvedValue(0);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.company.delete.mockResolvedValue(mockCompany);

      const result = await service.remove('company-123', mockOrgId);

      expect(result).toEqual({ message: 'Компания успешно удалена' });
    });

    it('should throw BadRequestException when company has contacts', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.contact.count.mockResolvedValue(5);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await expect(service.remove('company-123', mockOrgId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when company has deals', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompany);
      mockPrismaService.contact.count.mockResolvedValue(0);
      mockPrismaService.deal.count.mockResolvedValue(3);

      await expect(service.remove('company-123', mockOrgId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.remove('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCompanyStats', () => {
    it('should return company statistics', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.contact.count.mockResolvedValue(10);
      mockPrismaService.deal.count
        .mockResolvedValueOnce(5)   // active deals
        .mockResolvedValueOnce(8)   // won deals
        .mockResolvedValueOnce(2);  // lost deals
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
      mockPrismaService.activity.findFirst.mockResolvedValue({
        createdAt: new Date('2024-01-15'),
      });

      const result = await service.getCompanyStats('company-123', mockOrgId);

      expect(result.stats.contactsCount).toBe(10);
      expect(result.stats.activeDealsCount).toBe(5);
      expect(result.stats.totalDealsAmount).toBe(500000);
      expect(result.stats.wonDealsCount).toBe(8);
      expect(result.stats.lostDealsCount).toBe(2);
      expect(result.stats.conversionRate).toBe(80);
    });

    it('should handle zero won/lost deals', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.contact.count.mockResolvedValue(0);
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.deal.aggregate.mockResolvedValue({ _sum: { amount: null } });
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      const result = await service.getCompanyStats('company-123', mockOrgId);

      expect(result.stats.conversionRate).toBe(0);
      expect(result.stats.totalDealsAmount).toBe(0);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(service.getCompanyStats('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('mergeCompanies', () => {
    const originalCompany = {
      ...mockCompanyWithRelations,
      id: 'original-123',
      inn: '1111111111',
      website: 'https://original.ru',
    };

    const duplicateCompany = {
      ...mockCompanyWithRelations,
      id: 'duplicate-123',
      name: 'Дубликат компании',
      inn: null,
      website: null,
      address: 'Новый адрес',
    };

    it('should merge companies successfully', async () => {
      mockPrismaService.company.findFirst
        .mockResolvedValueOnce(originalCompany)
        .mockResolvedValueOnce(duplicateCompany);
      mockPrismaService.contact.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.deal.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.company.update.mockResolvedValue(originalCompany);
      mockPrismaService.company.delete.mockResolvedValue(duplicateCompany);
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await service.mergeCompanies(
        'original-123',
        'duplicate-123',
        mockUserId,
        mockOrgId
      );

      expect(result).toEqual({ message: 'Компании успешно объединены' });
      expect(mockPrismaService.contact.updateMany).toHaveBeenCalled();
      expect(mockPrismaService.deal.updateMany).toHaveBeenCalled();
      expect(mockPrismaService.company.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when original company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(
        service.mergeCompanies('unknown', 'duplicate-123', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when duplicate company not found', async () => {
      mockPrismaService.company.findFirst
        .mockResolvedValueOnce(originalCompany)
        .mockResolvedValueOnce(null);

      await expect(
        service.mergeCompanies('original-123', 'unknown', mockUserId, mockOrgId)
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
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.user.findUnique.mockResolvedValue(newOwner);
      mockPrismaService.company.update.mockResolvedValue({
        ...mockCompanyWithRelations,
        ownerId: newOwner.id,
        owner: newOwner,
      });
      mockPrismaService.contact.findMany.mockResolvedValue([]);

      const result = await service.changeOwner(
        'company-123',
        'new-owner-123',
        mockUserId,
        mockOrgId
      );

      expect(result.owner.id).toBe('new-owner-123');
    });

    it('should throw NotFoundException when company not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(null);

      await expect(
        service.changeOwner('unknown', 'new-owner-123', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new owner not found', async () => {
      mockPrismaService.company.findFirst.mockResolvedValue(mockCompanyWithRelations);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeOwner('company-123', 'unknown', mockUserId, mockOrgId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('importCompanies', () => {
    it('should throw BadRequestException for invalid file', async () => {
      // Mock file with invalid/empty buffer
      const mockFile = {
        buffer: Buffer.from(''),
        originalname: 'test.xlsx',
      } as Express.Multer.File;

      await expect(
        service.importCompanies(mockFile, mockUserId, mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportCompanies', () => {
    it('should return Buffer for XLSX export', async () => {
      mockPrismaService.company.findMany.mockResolvedValue([mockCompany]);
      mockPrismaService.company.count.mockResolvedValue(1);

      const result = await service.exportCompanies({}, mockOrgId);

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});
