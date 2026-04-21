import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketsService } from '../websockets/websockets.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;
  let websocketsService: WebsocketsService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockMessageId = 'message-123';
  const mockContactId = 'contact-123';

  const mockContact = {
    id: mockContactId,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    organizationId: mockOrganizationId,
  };

  const mockMessage = {
    id: mockMessageId,
    content: 'Hello, this is a test message',
    channel: 'whatsapp',
    direction: 'inbound',
    contactId: mockContactId,
    userId: mockUserId,
    organizationId: mockOrganizationId,
    isRead: false,
    createdAt: new Date(),
    contact: {
      id: mockContactId,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john@example.com',
    },
    user: {
      id: mockUserId,
      firstName: 'Agent',
      lastName: 'Smith',
      email: 'agent@example.com',
    },
  };

  const mockPrismaService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockWebsocketsService = {
    notifyNewMessage: jest.fn(),
    sendToUser: jest.fn(),
    sendToChannel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WebsocketsService,
          useValue: mockWebsocketsService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
    websocketsService = module.get<WebsocketsService>(WebsocketsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message and send websocket notification', async () => {
      const createDto = {
        content: 'Test message',
        channel: 'whatsapp',
        direction: 'outbound',
        contactId: mockContactId,
      };

      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.message.create.mockResolvedValue({
        ...mockMessage,
        ...createDto,
      });

      const result = await service.create(createDto as any, mockOrganizationId, mockUserId);

      expect(mockPrismaService.contact.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.message.create).toHaveBeenCalled();
      expect(mockWebsocketsService.notifyNewMessage).toHaveBeenCalledWith(
        mockContactId,
        expect.objectContaining({ content: 'Test message' }),
      );
      expect(result.content).toBe('Test message');
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ contactId: 'invalid' } as any, mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated messages', async () => {
      const messages = [mockMessage, { ...mockMessage, id: 'message-2' }];
      mockPrismaService.message.findMany.mockResolvedValue(messages);
      mockPrismaService.message.count.mockResolvedValue(2);

      const result = await service.findAll({}, mockOrganizationId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 2);
      expect(result.data).toHaveLength(2);
    });

    it('should filter by contactId', async () => {
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);
      mockPrismaService.message.count.mockResolvedValue(1);

      await service.findAll({ contactId: mockContactId }, mockOrganizationId);

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ contactId: mockContactId }),
        }),
      );
    });

    it('should filter by channel', async () => {
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);
      mockPrismaService.message.count.mockResolvedValue(1);

      await service.findAll({ channel: 'whatsapp' as any }, mockOrganizationId);

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ channel: 'whatsapp' }),
        }),
      );
    });

    it('should filter unread only', async () => {
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);
      mockPrismaService.message.count.mockResolvedValue(1);

      await service.findAll({ unreadOnly: true }, mockOrganizationId);

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRead: false }),
        }),
      );
    });

    it('should search by content', async () => {
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);
      mockPrismaService.message.count.mockResolvedValue(1);

      await service.findAll({ search: 'test' }, mockOrganizationId);

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            content: { contains: 'test', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single message', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);

      const result = await service.findOne(mockMessageId, mockOrganizationId);

      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid', mockOrganizationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const updateDto = { content: 'Updated content' };
      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({
        ...mockMessage,
        ...updateDto,
      });

      const result = await service.update(mockMessageId, updateDto as any, mockOrganizationId);

      expect(result.content).toBe('Updated content');
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({
        ...mockMessage,
        isRead: true,
      });

      const result = await service.markAsRead(mockMessageId, mockOrganizationId);

      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: mockMessageId },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all inbound messages as read', async () => {
      mockPrismaService.message.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markConversationAsRead(mockContactId, mockOrganizationId);

      expect(mockPrismaService.message.updateMany).toHaveBeenCalledWith({
        where: {
          contactId: mockContactId,
          organizationId: mockOrganizationId,
          isRead: false,
          direction: 'inbound',
        },
        data: { isRead: true },
      });
      expect(result.count).toBe(5);
    });
  });

  describe('remove', () => {
    it('should delete a message', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);
      mockPrismaService.message.delete.mockResolvedValue(mockMessage);

      const result = await service.remove(mockMessageId, mockOrganizationId);

      expect(result.message).toContain('удалено');
    });
  });

  describe('getConversations', () => {
    it('should return conversations with unread counts', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        {
          ...mockContact,
          messages: [mockMessage],
          _count: { messages: 2 },
          updatedAt: new Date(),
        },
      ]);
      mockPrismaService.message.count.mockResolvedValue(0);

      const result = await service.getConversations({}, mockOrganizationId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('channels');
      expect(result.data[0]).toHaveProperty('contactId');
      expect(result.data[0]).toHaveProperty('lastMessage');
      expect(result.data[0]).toHaveProperty('unreadCount');
    });

    it('should filter by channel', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.message.count.mockResolvedValue(0);

      await service.getConversations({ channel: 'whatsapp' as any }, mockOrganizationId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            messages: { some: { channel: 'whatsapp' } },
          }),
        }),
      );
    });

    it('should search by contact name', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([]);
      mockPrismaService.message.count.mockResolvedValue(0);

      await service.getConversations({ search: 'John' }, mockOrganizationId);

      expect(mockPrismaService.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'John', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('getConversation', () => {
    it('should return conversation with messages', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.message.findMany.mockResolvedValue([mockMessage]);
      mockPrismaService.message.count.mockResolvedValue(1);

      const result = await service.getConversation(mockContactId, mockOrganizationId);

      expect(result).toHaveProperty('contact');
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('unreadCount');
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.getConversation('invalid', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChannelStats', () => {
    it('should return statistics per channel', async () => {
      mockPrismaService.message.count.mockResolvedValue(10);

      const result = await service.getChannelStats(mockOrganizationId);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('channel', 'all');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('unreadCount');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.message.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(mockOrganizationId);

      expect(result.unreadCount).toBe(5);
    });
  });

  describe('sendMessage', () => {
    it('should create outbound message', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.message.create.mockResolvedValue({
        ...mockMessage,
        direction: 'outbound',
        isRead: true,
      });

      const result = await service.sendMessage(
        mockContactId,
        'Hello',
        'whatsapp',
        mockUserId,
        mockOrganizationId,
      );

      expect(mockPrismaService.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'outbound',
            isRead: true,
          }),
        }),
      );
    });
  });

  describe('receiveMessage', () => {
    it('should create inbound message', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(mockContact);
      mockPrismaService.message.create.mockResolvedValue({
        ...mockMessage,
        direction: 'inbound',
        isRead: false,
      });

      const result = await service.receiveMessage(
        mockContactId,
        'Hello',
        'telegram',
        mockOrganizationId,
      );

      expect(mockPrismaService.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            direction: 'inbound',
            isRead: false,
          }),
        }),
      );
    });
  });
});
