import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockNotificationId = 'notification-123';

  const mockUser = {
    id: mockUserId,
    email: 'user@example.com',
    firstName: 'Иван',
    lastName: 'Иванов',
  };

  const mockNotification = {
    id: mockNotificationId,
    userId: mockUserId,
    title: 'Новое уведомление',
    content: 'Тестовое сообщение',
    type: 'info',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  const mockReadNotification = {
    ...mockNotification,
    id: 'notification-456',
    isRead: true,
    readAt: new Date(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      userId: mockUserId,
      title: 'Новое уведомление',
      content: 'Тестовое сообщение',
      type: 'info',
    };

    it('should create a notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: createDto,
        include: { user: true },
      });
    });

    it('should include user relation in created notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUserId);
    });
  });

  describe('findAll', () => {
    it('should return all notifications for user', async () => {
      const notifications = [mockNotification, mockReadNotification];
      mockPrismaService.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(0);
    });

    it('should order notifications by createdAt desc', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('findUnread', () => {
    it('should return only unread notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await service.findUnread(mockUserId);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isRead: false },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when all read', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const result = await service.findUnread(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const readNotification = { ...mockNotification, isRead: true, readAt: new Date() };
      mockPrismaService.notification.update.mockResolvedValue(readNotification);

      const result = await service.markAsRead(mockNotificationId, mockUserId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should use both id and userId in where clause', async () => {
      mockPrismaService.notification.update.mockResolvedValue(mockReadNotification);

      await service.markAsRead(mockNotificationId, mockUserId);

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId, userId: mockUserId },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(5);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should return count 0 when no unread notifications', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead(mockUserId);

      expect(result.count).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await service.remove(mockNotificationId, mockUserId);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: mockNotificationId, userId: mockUserId },
      });
    });

    it('should use both id and userId for security', async () => {
      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      await service.remove(mockNotificationId, mockUserId);

      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: mockNotificationId, userId: mockUserId },
      });
    });
  });

  describe('createBulkNotification', () => {
    const bulkNotification = {
      title: 'Массовое уведомление',
      content: 'Сообщение для всех',
      type: 'info',
    };
    const userIds = ['user-1', 'user-2', 'user-3'];

    it('should create notifications for multiple users', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await service.createBulkNotification(userIds, bulkNotification);

      expect(result.count).toBe(3);
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: userIds.map((userId) => ({ ...bulkNotification, userId })),
      });
    });

    it('should create notification with userId for each user', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 3 });

      await service.createBulkNotification(userIds, bulkNotification);

      const callArg = mockPrismaService.notification.createMany.mock.calls[0][0];
      expect(callArg.data).toHaveLength(3);
      expect(callArg.data[0]).toEqual({ ...bulkNotification, userId: 'user-1' });
      expect(callArg.data[1]).toEqual({ ...bulkNotification, userId: 'user-2' });
      expect(callArg.data[2]).toEqual({ ...bulkNotification, userId: 'user-3' });
    });

    it('should handle empty userIds array', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 0 });

      const result = await service.createBulkNotification([], bulkNotification);

      expect(result.count).toBe(0);
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [],
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, isRead: false },
      });
    });

    it('should return 0 when no unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(0);
    });
  });
});
