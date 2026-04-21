import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';

describe('TelegramService', () => {
  let service: TelegramService;
  let prisma: PrismaService;
  let messagesService: MessagesService;

  const mockPrisma = {
    integrationConfig: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    telegramChat: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contact: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    orgMember: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3001'),
  };

  const mockMessagesService = {
    sendMessage: jest.fn(),
    receiveMessage: jest.fn(),
  };

  // Mock fetch globally
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    prisma = module.get<PrismaService>(PrismaService);
    messagesService = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBot', () => {
    const dto = {
      name: 'Test Bot',
      botToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
      welcomeMessage: 'Привет!',
      autoCreateContact: true,
    };
    const organizationId = 'org-1';

    it('should create a new Telegram bot', async () => {
      // Mock getMe API response
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          ok: true,
          result: {
            id: 123456789,
            is_bot: true,
            first_name: 'Test Bot',
            username: 'test_bot',
          },
        }),
      });

      // Mock setWebhook API response
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true }),
      });

      mockPrisma.integrationConfig.create.mockResolvedValue({
        id: 'int-1',
        organizationId,
        type: IntegrationType.TELEGRAM,
        name: dto.name,
        isActive: true,
        credentials: { botToken: dto.botToken, botUsername: 'test_bot', botId: 123456789 },
        settings: { welcomeMessage: dto.welcomeMessage, autoCreateContact: true },
        webhookSecret: 'secret123',
        webhookUrl: null,
        messagesReceived: 0,
        messagesSent: 0,
        lastActivityAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.integrationConfig.update.mockResolvedValue({
        id: 'int-1',
        webhookUrl: 'http://localhost:3001/api/telegram/webhook/int-1',
      });

      const result = await service.createBot(dto, organizationId);

      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.botUsername).toBe('test_bot');
      expect(mockPrisma.integrationConfig.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid bot token', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, description: 'Unauthorized' }),
      });

      await expect(service.createBot(dto, organizationId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBots', () => {
    it('should return all bots for organization', async () => {
      const mockBots = [
        {
          id: 'int-1',
          name: 'Bot 1',
          type: IntegrationType.TELEGRAM,
          isActive: true,
          credentials: { botUsername: 'bot1' },
          messagesReceived: 10,
          messagesSent: 5,
          createdAt: new Date(),
        },
        {
          id: 'int-2',
          name: 'Bot 2',
          type: IntegrationType.TELEGRAM,
          isActive: false,
          credentials: { botUsername: 'bot2' },
          messagesReceived: 0,
          messagesSent: 0,
          createdAt: new Date(),
        },
      ];

      mockPrisma.integrationConfig.findMany.mockResolvedValue(mockBots);

      const result = await service.getBots('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bot 1');
      expect(result[1].name).toBe('Bot 2');
    });
  });

  describe('getBot', () => {
    it('should return bot by id', async () => {
      const mockBot = {
        id: 'int-1',
        name: 'Test Bot',
        type: IntegrationType.TELEGRAM,
        isActive: true,
        credentials: { botUsername: 'test_bot' },
        messagesReceived: 10,
        messagesSent: 5,
        createdAt: new Date(),
      };

      mockPrisma.integrationConfig.findFirst.mockResolvedValue(mockBot);

      const result = await service.getBot('int-1', 'org-1');

      expect(result.id).toBe('int-1');
      expect(result.name).toBe('Test Bot');
    });

    it('should throw NotFoundException if bot not found', async () => {
      mockPrisma.integrationConfig.findFirst.mockResolvedValue(null);

      await expect(service.getBot('invalid-id', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBot', () => {
    it('should update bot settings', async () => {
      const mockBot = {
        id: 'int-1',
        name: 'Old Name',
        type: IntegrationType.TELEGRAM,
        isActive: true,
        credentials: { botToken: 'token', botUsername: 'test_bot' },
        settings: { welcomeMessage: 'Hello' },
        webhookUrl: 'http://localhost/webhook',
        webhookSecret: 'secret',
      };

      mockPrisma.integrationConfig.findFirst.mockResolvedValue(mockBot);
      mockPrisma.integrationConfig.update.mockResolvedValue({
        ...mockBot,
        name: 'New Name',
      });

      const result = await service.updateBot('int-1', { name: 'New Name' }, 'org-1');

      expect(result.name).toBe('New Name');
      expect(mockPrisma.integrationConfig.update).toHaveBeenCalled();
    });
  });

  describe('deleteBot', () => {
    it('should delete bot and remove webhook', async () => {
      const mockBot = {
        id: 'int-1',
        credentials: { botToken: 'token' },
      };

      mockPrisma.integrationConfig.findFirst.mockResolvedValue(mockBot);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true }),
      });
      mockPrisma.integrationConfig.delete.mockResolvedValue(mockBot);

      await service.deleteBot('int-1', 'org-1');

      expect(mockPrisma.integrationConfig.delete).toHaveBeenCalledWith({
        where: { id: 'int-1' },
      });
    });
  });

  describe('processWebhook', () => {
    const mockIntegration = {
      id: 'int-1',
      type: IntegrationType.TELEGRAM,
      isActive: true,
      organizationId: 'org-1',
      credentials: { botToken: 'token' },
      settings: { autoCreateContact: true, welcomeMessage: 'Hello!' },
      organization: { id: 'org-1' },
    };

    it('should process incoming message from new chat', async () => {
      mockPrisma.integrationConfig.findUnique.mockResolvedValue(mockIntegration);
      mockPrisma.telegramChat.findUnique.mockResolvedValue(null);
      mockPrisma.telegramChat.create.mockResolvedValue({
        id: 'chat-1',
        telegramChatId: '12345',
        contactId: null,
      });
      mockPrisma.orgMember.findFirst.mockResolvedValue({ userId: 'user-1' });
      mockPrisma.contact.create.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
      });
      mockPrisma.telegramChat.update.mockResolvedValue({
        id: 'chat-1',
        contactId: 'contact-1',
        contact: { id: 'contact-1' },
      });
      mockPrisma.integrationConfig.update.mockResolvedValue(mockIntegration);

      // Mock welcome message send
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: true }),
      });

      const update = {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 12345, type: 'private' as const },
          from: { id: 12345, is_bot: false, first_name: 'John', username: 'john_doe' },
          date: Date.now(),
          text: 'Hello!',
        },
      };

      await service.processWebhook('int-1', update);

      expect(mockPrisma.telegramChat.create).toHaveBeenCalled();
      expect(mockPrisma.contact.create).toHaveBeenCalled();
      expect(mockMessagesService.receiveMessage).toHaveBeenCalled();
    });

    it('should process message from existing chat with linked contact', async () => {
      mockPrisma.integrationConfig.findUnique.mockResolvedValue(mockIntegration);
      mockPrisma.telegramChat.findUnique.mockResolvedValue({
        id: 'chat-1',
        telegramChatId: '12345',
        contactId: 'contact-1',
        contact: { id: 'contact-1' },
      });
      mockPrisma.telegramChat.update.mockResolvedValue({
        id: 'chat-1',
        contactId: 'contact-1',
      });
      mockPrisma.integrationConfig.update.mockResolvedValue(mockIntegration);

      const update = {
        update_id: 2,
        message: {
          message_id: 2,
          chat: { id: 12345, type: 'private' as const },
          from: { id: 12345, is_bot: false, first_name: 'John' },
          date: Date.now(),
          text: 'Another message',
        },
      };

      await service.processWebhook('int-1', update);

      expect(mockMessagesService.receiveMessage).toHaveBeenCalledWith(
        'contact-1',
        'Another message',
        'telegram',
        'org-1',
        expect.any(Object),
      );
    });

    it('should skip processing for inactive bot', async () => {
      mockPrisma.integrationConfig.findUnique.mockResolvedValue({
        ...mockIntegration,
        isActive: false,
      });

      const update = {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 12345, type: 'private' as const },
          date: Date.now(),
          text: 'Hello!',
        },
      };

      await service.processWebhook('int-1', update);

      expect(mockPrisma.telegramChat.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message to contact via Telegram', async () => {
      const mockChat = {
        id: 'chat-1',
        telegramChatId: '12345',
        integration: {
          id: 'int-1',
          credentials: { botToken: 'token' },
        },
      };

      mockPrisma.telegramChat.findFirst.mockResolvedValue(mockChat);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          ok: true,
          result: { message_id: 100 },
        }),
      });
      mockPrisma.integrationConfig.update.mockResolvedValue({});
      mockMessagesService.sendMessage.mockResolvedValue({});

      const result = await service.sendMessage(
        { contactId: 'contact-1', text: 'Hello!' },
        'org-1',
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(100);
      expect(mockMessagesService.sendMessage).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no Telegram chat found', async () => {
      mockPrisma.telegramChat.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage({ contactId: 'contact-1', text: 'Hello!' }, 'org-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on Telegram API error', async () => {
      const mockChat = {
        id: 'chat-1',
        telegramChatId: '12345',
        integration: {
          id: 'int-1',
          credentials: { botToken: 'token' },
        },
      };

      mockPrisma.telegramChat.findFirst.mockResolvedValue(mockChat);
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          ok: false,
          description: 'Chat not found',
        }),
      });

      await expect(
        service.sendMessage({ contactId: 'contact-1', text: 'Hello!' }, 'org-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkChatToContact', () => {
    it('should link Telegram chat to contact', async () => {
      mockPrisma.telegramChat.findFirst.mockResolvedValue({
        id: 'chat-1',
        telegramChatId: '12345',
      });
      mockPrisma.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
      });
      mockPrisma.telegramChat.update.mockResolvedValue({});

      await service.linkChatToContact(
        { telegramChatId: 'chat-1', contactId: 'contact-1' },
        'org-1',
      );

      expect(mockPrisma.telegramChat.update).toHaveBeenCalledWith({
        where: { id: 'chat-1' },
        data: { contactId: 'contact-1' },
      });
    });

    it('should throw NotFoundException if chat not found', async () => {
      mockPrisma.telegramChat.findFirst.mockResolvedValue(null);

      await expect(
        service.linkChatToContact({ telegramChatId: 'invalid', contactId: 'contact-1' }, 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if contact not found', async () => {
      mockPrisma.telegramChat.findFirst.mockResolvedValue({
        id: 'chat-1',
      });
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.linkChatToContact({ telegramChatId: 'chat-1', contactId: 'invalid' }, 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnlinkedChats', () => {
    it('should return chats without linked contacts', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          telegramChatId: '12345',
          telegramUsername: 'user1',
          contactId: null,
          integration: { name: 'Bot 1' },
        },
        {
          id: 'chat-2',
          telegramChatId: '67890',
          telegramUsername: 'user2',
          contactId: null,
          integration: { name: 'Bot 1' },
        },
      ];

      mockPrisma.telegramChat.findMany.mockResolvedValue(mockChats);

      const result = await service.getUnlinkedChats('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].contactId).toBeNull();
    });
  });
});
