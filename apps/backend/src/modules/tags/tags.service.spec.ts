import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TagsService', () => {
  let service: TagsService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockTagId = 'tag-123';

  const mockTag = {
    id: mockTagId,
    name: 'VIP Client',
    color: '#FF5733',
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tag: {
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
        TagsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tag', async () => {
      const createDto = { name: 'New Tag', color: '#00FF00' };
      mockPrismaService.tag.create.mockResolvedValue({
        ...mockTag,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockOrganizationId);

      expect(mockPrismaService.tag.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrganizationId,
        },
      });
      expect(result.name).toBe('New Tag');
    });

    it('should create a tag with default color', async () => {
      const createDto = { name: 'Simple Tag' };
      mockPrismaService.tag.create.mockResolvedValue({
        ...mockTag,
        name: 'Simple Tag',
      });

      const result = await service.create(createDto as any, mockOrganizationId);

      expect(result.name).toBe('Simple Tag');
    });
  });

  describe('findAll', () => {
    it('should return all tags for organization sorted by name', async () => {
      const tags = [
        { ...mockTag, name: 'Alpha' },
        { ...mockTag, id: 'tag-2', name: 'Beta' },
      ];
      mockPrismaService.tag.findMany.mockResolvedValue(tags);

      const result = await service.findAll(mockOrganizationId);

      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockOrganizationId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single tag', async () => {
      mockPrismaService.tag.findFirst.mockResolvedValue(mockTag);

      const result = await service.findOne(mockTagId, mockOrganizationId);

      expect(mockPrismaService.tag.findFirst).toHaveBeenCalledWith({
        where: { id: mockTagId, organizationId: mockOrganizationId },
      });
      expect(result).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrismaService.tag.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a tag', async () => {
      const updateDto = { name: 'Updated Tag', color: '#0000FF' };
      mockPrismaService.tag.findFirst.mockResolvedValue(mockTag);
      mockPrismaService.tag.update.mockResolvedValue({
        ...mockTag,
        ...updateDto,
      });

      const result = await service.update(mockTagId, updateDto as any, mockOrganizationId);

      expect(mockPrismaService.tag.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.tag.update).toHaveBeenCalledWith({
        where: { id: mockTagId },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Tag');
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrismaService.tag.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' } as any, mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only color', async () => {
      const updateDto = { color: '#FFFF00' };
      mockPrismaService.tag.findFirst.mockResolvedValue(mockTag);
      mockPrismaService.tag.update.mockResolvedValue({
        ...mockTag,
        ...updateDto,
      });

      const result = await service.update(mockTagId, updateDto as any, mockOrganizationId);

      expect(result.color).toBe('#FFFF00');
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      mockPrismaService.tag.findFirst.mockResolvedValue(mockTag);
      mockPrismaService.tag.delete.mockResolvedValue(mockTag);

      const result = await service.remove(mockTagId, mockOrganizationId);

      expect(mockPrismaService.tag.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.tag.delete).toHaveBeenCalledWith({
        where: { id: mockTagId },
      });
      expect(result.message).toContain('успешно удален');
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrismaService.tag.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
