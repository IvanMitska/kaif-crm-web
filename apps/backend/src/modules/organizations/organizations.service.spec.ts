import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole } from '@prisma/client';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockOrganization = {
    id: mockOrgId,
    name: 'Тестовая организация',
    slug: 'test-organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrgWithCount = {
    ...mockOrganization,
    _count: { members: 5 },
  };

  const mockMember = {
    id: 'member-123',
    userId: mockUserId,
    organizationId: mockOrgId,
    role: OrgRole.MANAGER,
    isActive: true,
    joinedAt: new Date(),
  };

  const mockMemberWithUser = {
    ...mockMember,
    user: {
      id: mockUserId,
      email: 'user@example.com',
      firstName: 'Иван',
      lastName: 'Иванов',
      avatar: null,
      phone: '+79991234567',
      lastActivityAt: new Date(),
      isActive: true,
    },
  };

  const mockOwnerMember = {
    ...mockMember,
    id: 'owner-member-123',
    role: OrgRole.OWNER,
  };

  const mockPrismaService = {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orgMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { name: 'Новая организация' };

    it('should create an organization with owner membership', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          organization: { create: jest.fn().mockResolvedValue(mockOrganization) },
          orgMember: { create: jest.fn().mockResolvedValue(mockMember) },
        };
        return callback(tx);
      });

      const result = await service.create(createDto, mockUserId);

      expect(result).toEqual(mockOrganization);
    });

    it('should throw BadRequestException when slug exists', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      await expect(
        service.create({ ...createDto, slug: 'test-organization' }, mockUserId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should create with custom slug', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          organization: { create: jest.fn().mockResolvedValue(mockOrganization) },
          orgMember: { create: jest.fn().mockResolvedValue(mockMember) },
        };
        return callback(tx);
      });

      await service.create({ ...createDto, slug: 'custom-slug' }, mockUserId);

      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'custom-slug' },
      });
    });
  });

  describe('findById', () => {
    it('should return organization by id', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrgWithCount);

      const result = await service.findById(mockOrgId);

      expect(result).toEqual(mockOrgWithCount);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return organization by slug', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.findBySlug('test-organization');

      expect(result).toEqual(mockOrganization);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Обновленная организация' };

    it('should update organization successfully', async () => {
      const updated = { ...mockOrganization, ...updateDto };
      mockPrismaService.organization.update.mockResolvedValue(updated);

      const result = await service.update(mockOrgId, updateDto);

      expect(result.name).toBe('Обновленная организация');
    });

    it('should throw BadRequestException when new slug exists', async () => {
      mockPrismaService.organization.findFirst.mockResolvedValue(mockOrganization);

      await expect(
        service.update(mockOrgId, { slug: 'existing-slug' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow same slug for same organization', async () => {
      mockPrismaService.organization.findFirst.mockResolvedValue(null);
      mockPrismaService.organization.update.mockResolvedValue(mockOrganization);

      await service.update(mockOrgId, { slug: 'new-slug' });

      expect(mockPrismaService.organization.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'new-slug',
          NOT: { id: mockOrgId },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete organization', async () => {
      mockPrismaService.organization.delete.mockResolvedValue(mockOrganization);

      const result = await service.delete(mockOrgId);

      expect(result).toEqual(mockOrganization);
    });
  });

  describe('getMembers', () => {
    it('should return all members of organization', async () => {
      mockPrismaService.orgMember.findMany.mockResolvedValue([mockMemberWithUser]);

      const result = await service.getMembers(mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].user).toBeDefined();
    });
  });

  describe('getMember', () => {
    it('should return member by id', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMemberWithUser);

      const result = await service.getMember(mockOrgId, 'member-123');

      expect(result).toEqual(mockMemberWithUser);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      await expect(service.getMember(mockOrgId, 'unknown')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.orgMember.update.mockResolvedValue({
        ...mockMemberWithUser,
        role: OrgRole.ADMIN,
      });

      const result = await service.updateMemberRole(
        mockOrgId,
        'member-123',
        { role: OrgRole.ADMIN },
        mockUserId
      );

      expect(result.role).toBe(OrgRole.ADMIN);
    });

    it('should throw NotFoundException when member not found', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(mockOrgId, 'unknown', { role: OrgRole.ADMIN }, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when changing owner role', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockOwnerMember);

      await expect(
        service.updateMemberRole(mockOrgId, 'owner-member-123', { role: OrgRole.ADMIN }, mockUserId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when promoting to owner', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMember);

      await expect(
        service.updateMemberRole(mockOrgId, 'member-123', { role: OrgRole.OWNER }, mockUserId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.orgMember.delete.mockResolvedValue(mockMember);

      const result = await service.removeMember(mockOrgId, 'member-123', mockUserId);

      expect(mockPrismaService.orgMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-123' },
      });
    });

    it('should throw NotFoundException when member not found', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMember(mockOrgId, 'unknown', mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when removing owner', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockOwnerMember);

      await expect(
        service.removeMember(mockOrgId, 'owner-member-123', mockUserId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleMemberActive', () => {
    it('should toggle member active status', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMember);
      mockPrismaService.orgMember.update.mockResolvedValue({
        ...mockMemberWithUser,
        isActive: false,
      });

      const result = await service.toggleMemberActive(mockOrgId, 'member-123');

      expect(mockPrismaService.orgMember.update).toHaveBeenCalledWith({
        where: { id: 'member-123' },
        data: { isActive: false },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when member not found', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      await expect(
        service.toggleMemberActive(mockOrgId, 'unknown')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deactivating owner', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockOwnerMember);

      await expect(
        service.toggleMemberActive(mockOrgId, 'owner-member-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserOrganizations', () => {
    it('should return user organizations', async () => {
      mockPrismaService.orgMember.findMany.mockResolvedValue([
        { ...mockMember, organization: mockOrganization },
      ]);

      const result = await service.getUserOrganizations(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].organization).toBeDefined();
    });
  });

  describe('getUserMembership', () => {
    it('should return user membership in organization', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(mockMember);

      const result = await service.getUserMembership(mockUserId, mockOrgId);

      expect(result).toEqual(mockMember);
    });

    it('should return null when no membership', async () => {
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      const result = await service.getUserMembership(mockUserId, 'other-org');

      expect(result).toBeNull();
    });
  });
});
