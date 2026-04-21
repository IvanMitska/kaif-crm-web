import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockProductId = 'product-123';

  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
    description: 'A test product',
    sku: 'SKU-001',
    price: 99.99,
    currency: 'USD',
    isActive: true,
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'New Product',
        price: 149.99,
        sku: 'SKU-002',
      };
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockOrganizationId);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrganizationId,
        },
      });
      expect(result.name).toBe('New Product');
    });

    it('should create a product with all fields', async () => {
      const createDto = {
        name: 'Complete Product',
        description: 'Full description',
        price: 299.99,
        currency: 'EUR',
        sku: 'SKU-003',
        isActive: true,
      };
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockOrganizationId);

      expect(result.currency).toBe('EUR');
      expect(result.description).toBe('Full description');
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'product-2' }];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(2);

      const result = await service.findAll({} as any, mockOrganizationId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('skip', 0);
      expect(result).toHaveProperty('take', 20);
    });

    it('should filter products by search term in name', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll({ search: 'Test' } as any, mockOrganizationId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Test', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter products by search term in SKU', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll({ search: 'SKU-001' } as any, mockOrganizationId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { sku: { contains: 'SKU-001', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ skip: 10, take: 5 } as any, mockOrganizationId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should support sorting', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'name', sortOrder: 'asc' } as any, mockOrganizationId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should use default sort by updatedAt desc', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({} as any, mockOrganizationId);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProductId, mockOrganizationId);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: { id: mockProductId, organizationId: mockOrganizationId },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product', price: 199.99 };
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update(mockProductId, updateDto as any, mockOrganizationId);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(199.99);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' } as any, mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update product status', async () => {
      const updateDto = { isActive: false };
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update(mockProductId, updateDto as any, mockOrganizationId);

      expect(result.isActive).toBe(false);
    });

    it('should update product SKU', async () => {
      const updateDto = { sku: 'NEW-SKU-001' };
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update(mockProductId, updateDto as any, mockOrganizationId);

      expect(result.sku).toBe('NEW-SKU-001');
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove(mockProductId, mockOrganizationId);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: mockProductId },
      });
      expect(result.message).toContain('successfully deleted');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
