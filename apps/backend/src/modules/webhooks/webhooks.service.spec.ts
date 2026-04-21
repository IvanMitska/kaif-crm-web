import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WebhookEvent, WebhookStatus } from '@prisma/client';

// Mock fetch globally
global.fetch = jest.fn();

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockWebhookId = 'webhook-123';

  const mockWebhook = {
    id: mockWebhookId,
    organizationId: mockOrganizationId,
    name: 'Test Webhook',
    description: 'Test description',
    url: 'https://example.com/webhook',
    secret: 'test-secret',
    events: [WebhookEvent.CONTACT_CREATED, WebhookEvent.DEAL_WON],
    status: WebhookStatus.ACTIVE,
    maxRetries: 3,
    retryDelay: 60,
    headers: { 'X-Custom': 'value' },
    totalDeliveries: 10,
    successDeliveries: 8,
    failedDeliveries: 2,
    lastDeliveryAt: new Date(),
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: mockUserId,
    createdBy: {
      id: mockUserId,
      firstName: 'Test',
      lastName: 'User',
    },
  };

  const mockDelivery = {
    id: 'delivery-123',
    webhookId: mockWebhookId,
    event: WebhookEvent.CONTACT_CREATED,
    payload: { eventId: 'test', event: 'CONTACT_CREATED', data: {} },
    success: true,
    attempts: 1,
    statusCode: 200,
    responseBody: 'OK',
    responseTime: 150,
    error: null,
    createdAt: new Date(),
    deliveredAt: new Date(),
    nextRetryAt: null,
  };

  const mockPrismaService = {
    webhook: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhookDelivery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      const createDto = {
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: [WebhookEvent.CONTACT_CREATED],
      };

      mockPrismaService.webhook.create.mockResolvedValue(mockWebhook);

      const result = await service.createWebhook(createDto, mockUserId, mockOrganizationId);

      expect(result.name).toBe('Test Webhook');
      expect(mockPrismaService.webhook.create).toHaveBeenCalled();
    });

    it('should generate secret if not provided', async () => {
      const createDto = {
        name: 'New Webhook',
        url: 'https://example.com/webhook',
        events: [WebhookEvent.CONTACT_CREATED],
      };

      mockPrismaService.webhook.create.mockResolvedValue(mockWebhook);

      await service.createWebhook(createDto, mockUserId, mockOrganizationId);

      expect(mockPrismaService.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            secret: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockResolvedValue({
        ...mockWebhook,
        name: 'Updated Webhook',
      });

      const result = await service.updateWebhook(
        mockWebhookId,
        { name: 'Updated Webhook' },
        mockOrganizationId,
      );

      expect(result.name).toBe('Updated Webhook');
    });

    it('should throw NotFoundException when webhook not found', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.updateWebhook('non-existent', { name: 'Test' }, mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.delete.mockResolvedValue(mockWebhook);

      await service.deleteWebhook(mockWebhookId, mockOrganizationId);

      expect(mockPrismaService.webhook.delete).toHaveBeenCalledWith({
        where: { id: mockWebhookId },
      });
    });

    it('should throw NotFoundException when webhook not found', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteWebhook('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWebhooks', () => {
    it('should return list of webhooks', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);

      const result = await service.getWebhooks(mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Webhook');
    });

    it('should return empty array when no webhooks', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([]);

      const result = await service.getWebhooks(mockOrganizationId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getWebhook', () => {
    it('should return webhook by id', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);

      const result = await service.getWebhook(mockWebhookId, mockOrganizationId);

      expect(result.id).toBe(mockWebhookId);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.getWebhook('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWebhookSecret', () => {
    it('should return webhook secret', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);

      const result = await service.getWebhookSecret(mockWebhookId, mockOrganizationId);

      expect(result.secret).toBe('test-secret');
    });
  });

  describe('regenerateSecret', () => {
    it('should generate new secret', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      const result = await service.regenerateSecret(mockWebhookId, mockOrganizationId);

      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBe(64); // 32 bytes hex = 64 chars
    });
  });

  describe('dispatchEvent', () => {
    it('should dispatch event to subscribed webhooks', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrismaService.webhookDelivery.create.mockResolvedValue(mockDelivery);
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      await service.dispatchEvent(
        WebhookEvent.CONTACT_CREATED,
        mockOrganizationId,
        { id: 'contact-123' },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'CONTACT_CREATED',
          }),
        }),
      );
    });

    it('should not dispatch if no webhooks subscribed', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([]);

      await service.dispatchEvent(
        WebhookEvent.CONTACT_CREATED,
        mockOrganizationId,
        { id: 'contact-123' },
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle delivery failure', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrismaService.webhookDelivery.create.mockResolvedValue({
        ...mockDelivery,
        success: false,
      });
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await service.dispatchEvent(
        WebhookEvent.CONTACT_CREATED,
        mockOrganizationId,
        { id: 'contact-123' },
      );

      expect(mockPrismaService.webhookDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: false,
          }),
        }),
      );
    });
  });

  describe('testWebhook', () => {
    it('should send test request and return success', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      const result = await service.testWebhook(mockWebhookId, mockOrganizationId);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should return failure on error', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.testWebhook(mockWebhookId, mockOrganizationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getDeliveries', () => {
    it('should return list of deliveries', async () => {
      mockPrismaService.webhookDelivery.findMany.mockResolvedValue([mockDelivery]);
      mockPrismaService.webhookDelivery.count.mockResolvedValue(1);

      const result = await service.getDeliveries({}, mockOrganizationId);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by webhookId', async () => {
      mockPrismaService.webhookDelivery.findMany.mockResolvedValue([]);
      mockPrismaService.webhookDelivery.count.mockResolvedValue(0);

      await service.getDeliveries({ webhookId: mockWebhookId }, mockOrganizationId);

      expect(mockPrismaService.webhookDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            webhookId: mockWebhookId,
          }),
        }),
      );
    });

    it('should filter by success status', async () => {
      mockPrismaService.webhookDelivery.findMany.mockResolvedValue([]);
      mockPrismaService.webhookDelivery.count.mockResolvedValue(0);

      await service.getDeliveries({ successOnly: true }, mockOrganizationId);

      expect(mockPrismaService.webhookDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            success: true,
          }),
        }),
      );
    });
  });

  describe('getDelivery', () => {
    it('should return delivery by id', async () => {
      mockPrismaService.webhookDelivery.findFirst.mockResolvedValue(mockDelivery);

      const result = await service.getDelivery('delivery-123', mockOrganizationId);

      expect(result.id).toBe('delivery-123');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.webhookDelivery.findFirst.mockResolvedValue(null);

      await expect(
        service.getDelivery('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('retryDeliveryManual', () => {
    it('should throw BadRequestException if delivery already successful', async () => {
      mockPrismaService.webhookDelivery.findFirst.mockResolvedValue({
        ...mockDelivery,
        success: true,
        webhook: mockWebhook,
      });

      await expect(
        service.retryDeliveryManual('delivery-123', mockOrganizationId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if delivery not found', async () => {
      mockPrismaService.webhookDelivery.findFirst.mockResolvedValue(null);

      await expect(
        service.retryDeliveryManual('non-existent', mockOrganizationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return webhook stats', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([
        { ...mockWebhook, status: WebhookStatus.ACTIVE },
        { ...mockWebhook, id: 'webhook-2', status: WebhookStatus.PAUSED },
      ]);

      const result = await service.getStats(mockOrganizationId);

      expect(result.totalWebhooks).toBe(2);
      expect(result.activeWebhooks).toBe(1);
      expect(result.pausedWebhooks).toBe(1);
    });

    it('should calculate success rate', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([
        {
          ...mockWebhook,
          totalDeliveries: 100,
          successDeliveries: 90,
          failedDeliveries: 10,
        },
      ]);

      const result = await service.getStats(mockOrganizationId);

      expect(result.successRate).toBe(90);
    });
  });

  describe('getAvailableEvents', () => {
    it('should return all webhook events with descriptions', async () => {
      const result = await service.getAvailableEvents();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('event');
      expect(result[0]).toHaveProperty('description');
    });
  });
});
