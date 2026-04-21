import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { IntegrationType } from '@prisma/client';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let prisma: PrismaService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';

  const mockIntegration = {
    id: 'integration-123',
    organizationId: mockOrgId,
    type: IntegrationType.WHATSAPP,
    name: 'WhatsApp Business',
    isActive: true,
    credentials: {
      accessToken: 'test-token',
      phoneNumberId: 'phone-123',
      businessAccountId: 'ba-123',
      verifyToken: 'verify-token-123',
    },
    settings: {
      welcomeMessage: 'Добро пожаловать!',
      autoCreateContact: true,
    },
    webhookUrl: 'https://api.example.com/whatsapp/webhook/integration-123',
    webhookSecret: 'secret-123',
    messagesReceived: 10,
    messagesSent: 5,
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWhatsAppChat = {
    id: 'chat-123',
    integrationId: 'integration-123',
    waId: '79991234567',
    phoneNumber: '+79991234567',
    displayName: 'Иван Иванов',
    profilePicUrl: null,
    contactId: 'contact-123',
    lastInboundAt: new Date(),
    windowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    lastMessageAt: new Date(),
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    integration: mockIntegration,
    contact: {
      id: 'contact-123',
      firstName: 'Иван',
      lastName: 'Иванов',
    },
  };

  const mockPrismaService = {
    integrationConfig: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    whatsAppChat: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
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
    get: jest.fn().mockReturnValue('https://api.example.com'),
  };

  const mockMessagesService = {
    receiveMessage: jest.fn(),
    sendMessage: jest.fn(),
  };

  // Mock global fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccounts', () => {
    it('should return list of WhatsApp accounts', async () => {
      mockPrismaService.integrationConfig.findMany.mockResolvedValue([mockIntegration]);

      const result = await service.getAccounts(mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('integration-123');
      expect(result[0].name).toBe('WhatsApp Business');
      expect(mockPrismaService.integrationConfig.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          type: IntegrationType.WHATSAPP,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no accounts', async () => {
      mockPrismaService.integrationConfig.findMany.mockResolvedValue([]);

      const result = await service.getAccounts(mockOrgId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAccount', () => {
    it('should return account by id', async () => {
      mockPrismaService.integrationConfig.findFirst.mockResolvedValue(mockIntegration);

      const result = await service.getAccount('integration-123', mockOrgId);

      expect(result.id).toBe('integration-123');
      expect(result.name).toBe('WhatsApp Business');
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.integrationConfig.findFirst.mockResolvedValue(null);

      await expect(service.getAccount('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      mockPrismaService.integrationConfig.findFirst.mockResolvedValue(mockIntegration);
      mockPrismaService.integrationConfig.delete.mockResolvedValue(mockIntegration);

      await service.deleteAccount('integration-123', mockOrgId);

      expect(mockPrismaService.integrationConfig.delete).toHaveBeenCalledWith({
        where: { id: 'integration-123' },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.integrationConfig.findFirst.mockResolvedValue(null);

      await expect(service.deleteAccount('unknown', mockOrgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('verifyWebhookToken', () => {
    it('should return true for valid token', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue(mockIntegration);

      const result = await service.verifyWebhookToken('integration-123', 'verify-token-123');

      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue(mockIntegration);

      const result = await service.verifyWebhookToken('integration-123', 'wrong-token');

      expect(result).toBe(false);
    });

    it('should return false when integration not found', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue(null);

      const result = await service.verifyWebhookToken('unknown', 'token');

      expect(result).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue(mockWhatsAppChat);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          messages: [{ id: 'msg-123' }],
        }),
      });
      mockMessagesService.sendMessage.mockResolvedValue({});
      mockPrismaService.integrationConfig.update.mockResolvedValue(mockIntegration);
      mockPrismaService.whatsAppChat.update.mockResolvedValue(mockWhatsAppChat);

      const result = await service.sendMessage(
        { contactId: 'contact-123', text: 'Привет!' },
        mockOrgId,
        mockUserId
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockMessagesService.sendMessage).toHaveBeenCalled();
    });

    it('should throw NotFoundException when chat not found', async () => {
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage(
          { contactId: 'unknown', text: 'Test' },
          mockOrgId,
          mockUserId
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when conversation window is closed', async () => {
      const expiredChat = {
        ...mockWhatsAppChat,
        windowExpiresAt: new Date(Date.now() - 1000), // Expired
      };
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue(expiredChat);

      await expect(
        service.sendMessage(
          { contactId: 'contact-123', text: 'Test' },
          mockOrgId,
          mockUserId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkChatToContact', () => {
    it('should link chat to contact successfully', async () => {
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue({
        ...mockWhatsAppChat,
        contactId: null,
      });
      mockPrismaService.contact.findFirst.mockResolvedValue({
        id: 'contact-123',
        firstName: 'Иван',
      });
      mockPrismaService.whatsAppChat.update.mockResolvedValue(mockWhatsAppChat);

      await service.linkChatToContact(
        { whatsappChatId: 'chat-123', contactId: 'contact-123' },
        mockOrgId
      );

      expect(mockPrismaService.whatsAppChat.update).toHaveBeenCalledWith({
        where: { id: 'chat-123' },
        data: { contactId: 'contact-123' },
      });
    });

    it('should throw NotFoundException when chat not found', async () => {
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue(null);

      await expect(
        service.linkChatToContact(
          { whatsappChatId: 'unknown', contactId: 'contact-123' },
          mockOrgId
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.whatsAppChat.findFirst.mockResolvedValue(mockWhatsAppChat);
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(
        service.linkChatToContact(
          { whatsappChatId: 'chat-123', contactId: 'unknown' },
          mockOrgId
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnlinkedChats', () => {
    it('should return unlinked chats', async () => {
      const unlinkedChat = { ...mockWhatsAppChat, contactId: null };
      mockPrismaService.whatsAppChat.findMany.mockResolvedValue([unlinkedChat]);

      const result = await service.getUnlinkedChats(mockOrgId);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.whatsAppChat.findMany).toHaveBeenCalledWith({
        where: {
          contactId: null,
          integration: {
            organizationId: mockOrgId,
            type: IntegrationType.WHATSAPP,
          },
        },
        include: expect.any(Object),
        orderBy: { lastMessageAt: 'desc' },
      });
    });
  });

  describe('getChats', () => {
    it('should return all chats', async () => {
      mockPrismaService.whatsAppChat.findMany.mockResolvedValue([mockWhatsAppChat]);

      const result = await service.getChats(mockOrgId);

      expect(result).toHaveLength(1);
    });

    it('should filter by integrationId', async () => {
      mockPrismaService.whatsAppChat.findMany.mockResolvedValue([mockWhatsAppChat]);

      await service.getChats(mockOrgId, 'integration-123');

      expect(mockPrismaService.whatsAppChat.findMany).toHaveBeenCalledWith({
        where: {
          integration: {
            organizationId: mockOrgId,
            type: IntegrationType.WHATSAPP,
            id: 'integration-123',
          },
        },
        include: expect.any(Object),
        orderBy: { lastMessageAt: 'desc' },
      });
    });
  });

  describe('processWebhook', () => {
    const mockWebhookPayload = {
      object: 'whatsapp_business_account' as const,
      entry: [
        {
          id: 'ba-123',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp' as const,
                metadata: {
                  display_phone_number: '+79991234567',
                  phone_number_id: 'phone-123',
                },
                contacts: [
                  {
                    profile: { name: 'Иван Иванов' },
                    wa_id: '79991234567',
                  },
                ],
                messages: [
                  {
                    from: '79991234567',
                    id: 'msg-123',
                    timestamp: '1234567890',
                    type: 'text' as const,
                    text: { body: 'Привет!' },
                  },
                ],
              },
              field: 'messages' as const,
            },
          ],
        },
      ],
    };

    it('should process incoming message', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue({
        ...mockIntegration,
        organization: { id: mockOrgId },
      });
      mockPrismaService.whatsAppChat.findUnique.mockResolvedValue(mockWhatsAppChat);
      mockPrismaService.whatsAppChat.update.mockResolvedValue(mockWhatsAppChat);
      mockMessagesService.receiveMessage.mockResolvedValue({});
      mockPrismaService.integrationConfig.update.mockResolvedValue(mockIntegration);

      await service.processWebhook('integration-123', mockWebhookPayload);

      expect(mockMessagesService.receiveMessage).toHaveBeenCalledWith(
        'contact-123',
        'Привет!',
        'whatsapp',
        mockOrgId,
        expect.any(Object)
      );
    });

    it('should create new chat for new contact', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue({
        ...mockIntegration,
        organization: { id: mockOrgId },
      });
      mockPrismaService.whatsAppChat.findUnique.mockResolvedValue(null);
      mockPrismaService.whatsAppChat.create.mockResolvedValue({
        ...mockWhatsAppChat,
        contactId: null,
      });
      mockPrismaService.orgMember.findFirst.mockResolvedValue({ userId: mockUserId });
      mockPrismaService.contact.create.mockResolvedValue({
        id: 'new-contact-123',
        firstName: 'Иван',
      });
      mockPrismaService.whatsAppChat.update.mockResolvedValue(mockWhatsAppChat);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messages: [{ id: 'welcome-msg' }] }),
      });
      mockPrismaService.integrationConfig.update.mockResolvedValue(mockIntegration);

      await service.processWebhook('integration-123', mockWebhookPayload);

      expect(mockPrismaService.whatsAppChat.create).toHaveBeenCalled();
    });

    it('should not process when integration is inactive', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue({
        ...mockIntegration,
        isActive: false,
      });

      await service.processWebhook('integration-123', mockWebhookPayload);

      expect(mockMessagesService.receiveMessage).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when integration not found', async () => {
      mockPrismaService.integrationConfig.findUnique.mockResolvedValue(null);

      await expect(
        service.processWebhook('unknown', mockWebhookPayload)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
