import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailImapService } from './email-imap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationType } from '@prisma/client';

// Mock imapflow
jest.mock('imapflow', () => ({
  ImapFlow: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    mailboxOpen: jest.fn().mockResolvedValue({ exists: 10 }),
    fetch: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: jest.fn().mockResolvedValue({ done: true }),
      }),
    }),
  })),
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('EmailImapService', () => {
  let service: EmailImapService;
  let prismaService: PrismaService;
  let messagesService: MessagesService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockAccountId = 'account-123';
  const mockIntegrationId = 'integration-123';

  const mockEmailAccount = {
    id: mockAccountId,
    integrationId: mockIntegrationId,
    email: 'test@example.com',
    displayName: 'Test User',
    imapHost: 'imap.example.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: false,
    syncEnabled: true,
    syncFolder: 'INBOX',
    lastSyncAt: null,
    lastSyncError: null,
    emailsReceived: 0,
    emailsSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    integration: {
      id: mockIntegrationId,
      organizationId: mockOrganizationId,
      type: IntegrationType.EMAIL,
      name: 'Test Account',
      isActive: true,
      credentials: { password: 'test-password' },
      settings: { autoLinkContacts: true },
    },
  };

  const mockEmailMessage = {
    id: 'message-123',
    emailAccountId: mockAccountId,
    messageId: '<test@example.com>',
    uid: 1,
    threadId: null,
    fromEmail: 'sender@example.com',
    fromName: 'Sender Name',
    toEmails: ['test@example.com'],
    ccEmails: [],
    bccEmails: [],
    replyTo: null,
    subject: 'Test Subject',
    textBody: 'Test body',
    htmlBody: '<p>Test body</p>',
    snippet: 'Test body',
    isSent: false,
    isRead: false,
    isStarred: false,
    isArchived: false,
    isDeleted: false,
    contactId: null,
    emailDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    emailAccount: {
      id: mockAccountId,
      email: 'test@example.com',
      displayName: 'Test User',
    },
    contact: null,
  };

  const mockPrismaService = {
    integrationConfig: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    emailMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    contact: {
      findFirst: jest.fn(),
    },
    orgMember: {
      findFirst: jest.fn(),
    },
  };

  const mockMessagesService = {
    sendMessage: jest.fn().mockResolvedValue({}),
    receiveMessage: jest.fn().mockResolvedValue({}),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailImapService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailImapService>(EmailImapService);
    prismaService = module.get<PrismaService>(PrismaService);
    messagesService = module.get<MessagesService>(MessagesService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getAccounts', () => {
    it('should return list of email accounts', async () => {
      mockPrismaService.emailAccount.findMany.mockResolvedValue([mockEmailAccount]);

      const result = await service.getAccounts(mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
      expect(mockPrismaService.emailAccount.findMany).toHaveBeenCalledWith({
        where: {
          integration: {
            organizationId: mockOrganizationId,
            type: IntegrationType.EMAIL,
          },
        },
        include: { integration: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no accounts', async () => {
      mockPrismaService.emailAccount.findMany.mockResolvedValue([]);

      const result = await service.getAccounts(mockOrganizationId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAccount', () => {
    it('should return account by id', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);

      const result = await service.getAccount(mockAccountId, mockOrganizationId);

      expect(result.id).toBe(mockAccountId);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(null);

      await expect(service.getAccount('non-existent', mockOrganizationId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('createAccount', () => {
    const createDto = {
      name: 'New Account',
      email: 'new@example.com',
      password: 'password123',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: false,
    };

    it('should create new email account', async () => {
      mockPrismaService.integrationConfig.create.mockResolvedValue({
        id: mockIntegrationId,
        ...createDto,
      });
      mockPrismaService.emailAccount.create.mockResolvedValue(mockEmailAccount);

      const result = await service.createAccount(createDto, mockOrganizationId);

      expect(result.email).toBe('test@example.com');
      expect(mockPrismaService.integrationConfig.create).toHaveBeenCalled();
      expect(mockPrismaService.emailAccount.create).toHaveBeenCalled();
    });
  });

  describe('updateAccount', () => {
    const updateDto = {
      displayName: 'Updated Name',
      syncEnabled: false,
    };

    it('should update account', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailAccount.update.mockResolvedValue({
        ...mockEmailAccount,
        displayName: 'Updated Name',
        syncEnabled: false,
      });

      const result = await service.updateAccount(mockAccountId, updateDto, mockOrganizationId);

      expect(result.displayName).toBe('Updated Name');
      expect(mockPrismaService.emailAccount.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(null);

      await expect(service.updateAccount('non-existent', updateDto, mockOrganizationId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.integrationConfig.delete.mockResolvedValue({});

      await service.deleteAccount(mockAccountId, mockOrganizationId);

      expect(mockPrismaService.integrationConfig.delete).toHaveBeenCalledWith({
        where: { id: mockIntegrationId },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(null);

      await expect(service.deleteAccount('non-existent', mockOrganizationId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      const result = await service.testConnection({
        email: 'test@example.com',
        password: 'password',
        imapHost: 'imap.example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Подключение успешно');
    });
  });

  describe('getEmails', () => {
    it('should return list of emails', async () => {
      mockPrismaService.emailMessage.findMany.mockResolvedValue([mockEmailMessage]);
      mockPrismaService.emailMessage.count.mockResolvedValue(1);

      const result = await service.getEmails({}, mockOrganizationId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by accountId', async () => {
      mockPrismaService.emailMessage.findMany.mockResolvedValue([]);
      mockPrismaService.emailMessage.count.mockResolvedValue(0);

      await service.getEmails({ accountId: mockAccountId }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            emailAccount: expect.objectContaining({
              id: mockAccountId,
            }),
          }),
        }),
      );
    });

    it('should filter by unreadOnly', async () => {
      mockPrismaService.emailMessage.findMany.mockResolvedValue([]);
      mockPrismaService.emailMessage.count.mockResolvedValue(0);

      await service.getEmails({ unreadOnly: true }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        }),
      );
    });

    it('should support search', async () => {
      mockPrismaService.emailMessage.findMany.mockResolvedValue([]);
      mockPrismaService.emailMessage.count.mockResolvedValue(0);

      await service.getEmails({ search: 'test' }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ subject: { contains: 'test', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('getEmail', () => {
    it('should return email by id', async () => {
      mockPrismaService.emailMessage.findFirst.mockResolvedValue(mockEmailMessage);

      const result = await service.getEmail('message-123', mockOrganizationId);

      expect(result.id).toBe('message-123');
      expect(result.subject).toBe('Test Subject');
    });

    it('should throw NotFoundException when email not found', async () => {
      mockPrismaService.emailMessage.findFirst.mockResolvedValue(null);

      await expect(service.getEmail('non-existent', mockOrganizationId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('markEmails', () => {
    it('should mark emails as read', async () => {
      mockPrismaService.emailMessage.updateMany.mockResolvedValue({ count: 1 });

      await service.markEmails({
        messageIds: ['message-123'],
        isRead: true,
      }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['message-123'] },
          emailAccount: {
            integration: { organizationId: mockOrganizationId },
          },
        },
        data: { isRead: true },
      });
    });

    it('should mark emails as starred', async () => {
      mockPrismaService.emailMessage.updateMany.mockResolvedValue({ count: 1 });

      await service.markEmails({
        messageIds: ['message-123'],
        isStarred: true,
      }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isStarred: true },
        }),
      );
    });
  });

  describe('deleteEmails', () => {
    it('should soft delete emails', async () => {
      mockPrismaService.emailMessage.updateMany.mockResolvedValue({ count: 1 });

      await service.deleteEmails(['message-123'], mockOrganizationId);

      expect(mockPrismaService.emailMessage.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['message-123'] },
          emailAccount: {
            integration: { organizationId: mockOrganizationId },
          },
        },
        data: { isDeleted: true },
      });
    });
  });

  describe('linkEmailToContact', () => {
    it('should link email to contact', async () => {
      const contactId = 'contact-123';
      mockPrismaService.contact.findFirst.mockResolvedValue({ id: contactId });
      mockPrismaService.emailMessage.updateMany.mockResolvedValue({ count: 1 });

      await service.linkEmailToContact({
        messageId: 'message-123',
        contactId,
      }, mockOrganizationId);

      expect(mockPrismaService.emailMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { contactId },
        }),
      );
    });

    it('should throw NotFoundException when contact not found', async () => {
      mockPrismaService.contact.findFirst.mockResolvedValue(null);

      await expect(service.linkEmailToContact({
        messageId: 'message-123',
        contactId: 'non-existent',
      }, mockOrganizationId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendEmail', () => {
    const sendDto = {
      accountId: mockAccountId,
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      text: 'Test body',
    };

    it('should send email successfully', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailMessage.create.mockResolvedValue(mockEmailMessage);
      mockPrismaService.emailAccount.update.mockResolvedValue(mockEmailAccount);

      const result = await service.sendEmail(sendDto, mockUserId, mockOrganizationId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.emailMessage.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when SMTP not configured', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue({
        ...mockEmailAccount,
        smtpHost: null,
      });

      await expect(service.sendEmail(sendDto, mockUserId, mockOrganizationId))
        .rejects.toThrow(BadRequestException);
    });

    it('should create CRM message when contactId provided', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailMessage.create.mockResolvedValue(mockEmailMessage);
      mockPrismaService.emailAccount.update.mockResolvedValue(mockEmailAccount);

      await service.sendEmail({
        ...sendDto,
        contactId: 'contact-123',
      }, mockUserId, mockOrganizationId);

      expect(mockMessagesService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('replyToEmail', () => {
    const replyDto = {
      originalMessageId: 'message-123',
      text: 'Reply text',
    };

    it('should reply to email', async () => {
      mockPrismaService.emailMessage.findFirst.mockResolvedValueOnce({
        ...mockEmailMessage,
        emailAccount: mockEmailAccount,
      });
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailMessage.create.mockResolvedValue(mockEmailMessage);
      mockPrismaService.emailAccount.update.mockResolvedValue(mockEmailAccount);

      const result = await service.replyToEmail(replyDto, mockUserId, mockOrganizationId);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when original email not found', async () => {
      mockPrismaService.emailMessage.findFirst.mockResolvedValue(null);

      await expect(service.replyToEmail(replyDto, mockUserId, mockOrganizationId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('syncAccount', () => {
    it('should return error when sync disabled', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue({
        ...mockEmailAccount,
        syncEnabled: false,
      });

      const result = await service.syncAccount(mockAccountId, mockOrganizationId);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Синхронизация отключена');
    });

    it('should sync account successfully', async () => {
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailMessage.findFirst.mockResolvedValue(null);
      mockPrismaService.emailAccount.update.mockResolvedValue(mockEmailAccount);

      const result = await service.syncAccount(mockAccountId, mockOrganizationId);

      expect(result.success).toBe(true);
    });
  });

  describe('syncAllAccounts', () => {
    it('should sync all enabled accounts', async () => {
      mockPrismaService.emailAccount.findMany.mockResolvedValue([mockEmailAccount]);
      mockPrismaService.emailAccount.findFirst.mockResolvedValue(mockEmailAccount);
      mockPrismaService.emailMessage.findFirst.mockResolvedValue(null);
      mockPrismaService.emailAccount.update.mockResolvedValue(mockEmailAccount);

      const results = await service.syncAllAccounts(mockOrganizationId);

      expect(results).toHaveLength(1);
    });
  });

  describe('getEmailStats', () => {
    it('should return email stats', async () => {
      mockPrismaService.emailAccount.findMany.mockResolvedValue([mockEmailAccount]);
      mockPrismaService.emailMessage.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30);

      const result = await service.getEmailStats(mockOrganizationId);

      expect(result.totalAccounts).toBe(1);
      expect(result.activeAccounts).toBe(1);
      expect(result.totalEmails).toBe(100);
      expect(result.unreadEmails).toBe(10);
      expect(result.sentEmails).toBe(30);
      expect(result.receivedEmails).toBe(70);
    });
  });
});
