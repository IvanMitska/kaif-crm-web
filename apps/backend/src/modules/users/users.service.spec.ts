import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    phone: '+7 999 123-45-67',
    avatar: null,
    role: UserRole.MANAGER,
    isActive: true,
    twoFactorEnabled: false,
    lastLoginAt: null,
    lastActivityAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    teams: [],
    ownedContacts: [],
    ownedDeals: [],
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      count: jest.fn(),
    },
    deal: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll({ skip: 0, take: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: createData.email,
        firstName: createData.firstName,
        lastName: createData.lastName,
      });

      const result = await service.create(createData);

      expect(result).toHaveProperty('email', createData.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });

      const result = await service.update('user-123', { firstName: 'Updated' });

      expect(result.firstName).toBe('Updated');
    });

    it('should throw BadRequestException if new email already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // findOne
        .mockResolvedValueOnce({ ...mockUser, id: 'other-user' }); // findByEmail

      await expect(
        service.update('user-123', { email: 'other@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      const result = await service.updateRole('user-123', UserRole.ADMIN);

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('toggleActive', () => {
    it('should toggle user active status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.toggleActive('user-123');

      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.delete('user-123');

      expect(result).toHaveProperty('message');
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.delete('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.contact.count.mockResolvedValue(10);
      mockPrismaService.deal.count.mockResolvedValue(5);
      mockPrismaService.task.count
        .mockResolvedValueOnce(20) // total tasks
        .mockResolvedValueOnce(15); // completed tasks
      mockPrismaService.deal.findMany.mockResolvedValue([
        { amount: 1000 },
        { amount: 2000 },
      ]);

      const result = await service.getUserStats('user-123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('stats');
      expect(result.stats.contactsCount).toBe(10);
      expect(result.stats.dealsCount).toBe(5);
      expect(result.stats.tasksCount).toBe(20);
      expect(result.stats.completedTasksCount).toBe(15);
      expect(result.stats.totalActiveDealsAmount).toBe(3000);
      expect(result.stats.taskCompletionRate).toBe(75);
    });
  });

  describe('getOnlineUsers', () => {
    it('should return online users', async () => {
      const onlineUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(onlineUsers);

      const result = await service.getOnlineUsers();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('count', 1);
    });
  });
});
