import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookEvent, WebhookStatus } from '@prisma/client';
import * as crypto from 'crypto';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookInfoDto,
  WebhookDeliveryDto,
  WebhookDeliveryFilterDto,
} from './dto/webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  // ============ Webhook Management ============

  async createWebhook(
    dto: CreateWebhookDto,
    userId: string,
    organizationId: string,
  ): Promise<WebhookInfoDto> {
    // Generate secret if not provided
    const secret = dto.secret || crypto.randomBytes(32).toString('hex');

    const webhook = await this.prisma.webhook.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        url: dto.url,
        secret,
        events: dto.events,
        maxRetries: dto.maxRetries ?? 3,
        retryDelay: dto.retryDelay ?? 60,
        headers: dto.headers as any,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(`Webhook created: ${webhook.id} for organization ${organizationId}`);

    return this.mapToWebhookInfo(webhook);
  }

  async updateWebhook(
    webhookId: string,
    dto: UpdateWebhookDto,
    organizationId: string,
  ): Promise<WebhookInfoDto> {
    await this.findWebhook(webhookId, organizationId);

    const webhook = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        name: dto.name,
        description: dto.description,
        url: dto.url,
        secret: dto.secret,
        events: dto.events,
        status: dto.status,
        maxRetries: dto.maxRetries,
        retryDelay: dto.retryDelay,
        headers: dto.headers as any,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(`Webhook updated: ${webhookId}`);

    return this.mapToWebhookInfo(webhook);
  }

  async deleteWebhook(webhookId: string, organizationId: string): Promise<void> {
    await this.findWebhook(webhookId, organizationId);

    await this.prisma.webhook.delete({
      where: { id: webhookId },
    });

    this.logger.log(`Webhook deleted: ${webhookId}`);
  }

  async getWebhooks(organizationId: string): Promise<WebhookInfoDto[]> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((w) => this.mapToWebhookInfo(w));
  }

  async getWebhook(webhookId: string, organizationId: string): Promise<WebhookInfoDto> {
    const webhook = await this.findWebhook(webhookId, organizationId);
    return this.mapToWebhookInfo(webhook);
  }

  async getWebhookSecret(webhookId: string, organizationId: string): Promise<{ secret: string }> {
    const webhook = await this.findWebhook(webhookId, organizationId);
    return { secret: webhook.secret || '' };
  }

  async regenerateSecret(webhookId: string, organizationId: string): Promise<{ secret: string }> {
    await this.findWebhook(webhookId, organizationId);

    const secret = crypto.randomBytes(32).toString('hex');

    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { secret },
    });

    this.logger.log(`Webhook secret regenerated: ${webhookId}`);

    return { secret };
  }

  // ============ Event Dispatching ============

  async dispatchEvent(
    event: WebhookEvent,
    organizationId: string,
    data: any,
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        status: WebhookStatus.ACTIVE,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    this.logger.debug(`Dispatching ${event} to ${webhooks.length} webhooks`);

    // Build payload
    const payload = {
      eventId: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };

    // Dispatch to all webhooks in parallel
    const promises = webhooks.map((webhook) =>
      this.deliverWebhook(webhook, event, payload),
    );

    await Promise.allSettled(promises);
  }

  private async deliverWebhook(
    webhook: any,
    event: WebhookEvent,
    payload: any,
  ): Promise<void> {
    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let responseBody: string | undefined;
    let error: string | undefined;

    try {
      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Delivery': payload.eventId,
        ...(webhook.headers as Record<string, string> || {}),
      };

      // Send request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      statusCode = response.status;
      responseBody = await response.text().catch(() => '');

      if (response.ok) {
        success = true;
      } else {
        error = `HTTP ${statusCode}: ${responseBody?.substring(0, 500)}`;
      }
    } catch (err) {
      const e = err as Error;
      error = e.message;
      this.logger.error(`Webhook delivery failed: ${webhook.id} - ${e.message}`);
    }

    const responseTime = Date.now() - startTime;

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload,
        success,
        statusCode,
        responseBody: responseBody?.substring(0, 10000),
        responseTime,
        error,
        deliveredAt: success ? new Date() : null,
        nextRetryAt: !success && webhook.maxRetries > 0
          ? new Date(Date.now() + webhook.retryDelay * 1000)
          : null,
      },
    });

    // Update webhook stats
    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        totalDeliveries: { increment: 1 },
        successDeliveries: success ? { increment: 1 } : undefined,
        failedDeliveries: !success ? { increment: 1 } : undefined,
        lastDeliveryAt: new Date(),
        lastError: !success ? error : null,
        // Mark as failed if too many consecutive failures
        status: !success && webhook.failedDeliveries >= 10
          ? WebhookStatus.FAILED
          : undefined,
      },
    });

    // Schedule retry if failed
    if (!success && webhook.maxRetries > 0) {
      this.scheduleRetry(delivery.id, webhook, 1);
    }
  }

  private scheduleRetry(deliveryId: string, webhook: any, attempt: number): void {
    if (attempt > webhook.maxRetries) {
      return;
    }

    const delay = webhook.retryDelay * 1000 * Math.pow(2, attempt - 1); // Exponential backoff

    setTimeout(async () => {
      await this.retryDelivery(deliveryId, webhook, attempt);
    }, delay);
  }

  private async retryDelivery(
    deliveryId: string,
    webhook: any,
    attempt: number,
  ): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.success) {
      return;
    }

    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let responseBody: string | undefined;
    let error: string | undefined;

    try {
      const signature = this.generateSignature(delivery.payload, webhook.secret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Delivery': (delivery.payload as any).eventId,
        'X-Webhook-Retry': attempt.toString(),
        ...(webhook.headers as Record<string, string> || {}),
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(30000),
      });

      statusCode = response.status;
      responseBody = await response.text().catch(() => '');

      if (response.ok) {
        success = true;
      } else {
        error = `HTTP ${statusCode}: ${responseBody?.substring(0, 500)}`;
      }
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }

    const responseTime = Date.now() - startTime;

    // Update delivery record
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        success,
        attempts: attempt + 1,
        statusCode,
        responseBody: responseBody?.substring(0, 10000),
        responseTime,
        error,
        deliveredAt: success ? new Date() : null,
        nextRetryAt: !success && attempt < webhook.maxRetries
          ? new Date(Date.now() + webhook.retryDelay * 1000 * Math.pow(2, attempt))
          : null,
      },
    });

    // Update webhook stats
    if (success) {
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          successDeliveries: { increment: 1 },
          failedDeliveries: { decrement: 1 },
          lastError: null,
        },
      });
    } else if (attempt < webhook.maxRetries) {
      this.scheduleRetry(deliveryId, webhook, attempt + 1);
    }
  }

  private generateSignature(payload: any, secret: string | null): string {
    if (!secret) return '';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  // ============ Test Webhook ============

  async testWebhook(
    webhookId: string,
    organizationId: string,
    event?: WebhookEvent,
  ): Promise<{ success: boolean; statusCode?: number; responseTime?: number; error?: string }> {
    const webhook = await this.findWebhook(webhookId, organizationId);

    const testEvent = event || webhook.events[0] || WebhookEvent.CONTACT_CREATED;

    const payload = {
      eventId: crypto.randomUUID(),
      event: testEvent,
      timestamp: new Date().toISOString(),
      organizationId,
      test: true,
      data: {
        message: 'This is a test webhook delivery',
        webhookId,
        event: testEvent,
      },
    };

    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let error: string | undefined;

    try {
      const signature = this.generateSignature(payload, webhook.secret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': testEvent,
        'X-Webhook-Delivery': payload.eventId,
        'X-Webhook-Test': 'true',
        ...(webhook.headers as Record<string, string> || {}),
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      statusCode = response.status;
      success = response.ok;

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        error = `HTTP ${statusCode}: ${body.substring(0, 500)}`;
      }
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }

    const responseTime = Date.now() - startTime;

    this.logger.log(`Webhook test: ${webhookId} - ${success ? 'success' : 'failed'}`);

    return { success, statusCode, responseTime, error };
  }

  // ============ Delivery History ============

  async getDeliveries(
    filter: WebhookDeliveryFilterDto,
    organizationId: string,
  ): Promise<{ data: WebhookDeliveryDto[]; total: number }> {
    const { skip = 0, take = 50 } = filter;

    const where: any = {
      webhook: { organizationId },
      ...(filter.webhookId ? { webhookId: filter.webhookId } : {}),
      ...(filter.event ? { event: filter.event } : {}),
      ...(filter.successOnly ? { success: true } : {}),
      ...(filter.failedOnly ? { success: false } : {}),
    };

    const [deliveries, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return {
      data: deliveries.map((d) => this.mapToDeliveryDto(d)),
      total,
    };
  }

  async getDelivery(
    deliveryId: string,
    organizationId: string,
  ): Promise<WebhookDeliveryDto> {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhook: { organizationId },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Доставка не найдена');
    }

    return this.mapToDeliveryDto(delivery);
  }

  async retryDeliveryManual(
    deliveryId: string,
    organizationId: string,
  ): Promise<{ success: boolean }> {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhook: { organizationId },
      },
      include: { webhook: true },
    });

    if (!delivery) {
      throw new NotFoundException('Доставка не найдена');
    }

    if (delivery.success) {
      throw new BadRequestException('Доставка уже успешна');
    }

    await this.retryDelivery(deliveryId, delivery.webhook, delivery.attempts);

    // Check if retry was successful
    const updated = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    return { success: updated?.success || false };
  }

  // ============ Stats ============

  async getStats(organizationId: string): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    pausedWebhooks: number;
    failedWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId },
    });

    const totals = webhooks.reduce(
      (acc, w) => ({
        total: acc.total + w.totalDeliveries,
        success: acc.success + w.successDeliveries,
        failed: acc.failed + w.failedDeliveries,
      }),
      { total: 0, success: 0, failed: 0 },
    );

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter((w) => w.status === WebhookStatus.ACTIVE).length,
      pausedWebhooks: webhooks.filter((w) => w.status === WebhookStatus.PAUSED).length,
      failedWebhooks: webhooks.filter((w) => w.status === WebhookStatus.FAILED).length,
      totalDeliveries: totals.total,
      successfulDeliveries: totals.success,
      failedDeliveries: totals.failed,
      successRate: totals.total > 0 ? Math.round((totals.success / totals.total) * 100) : 100,
    };
  }

  async getAvailableEvents(): Promise<{ event: WebhookEvent; description: string }[]> {
    return Object.values(WebhookEvent).map((event) => ({
      event,
      description: this.getEventDescription(event),
    }));
  }

  private getEventDescription(event: WebhookEvent): string {
    const descriptions: Record<WebhookEvent, string> = {
      CONTACT_CREATED: 'Создан новый контакт',
      CONTACT_UPDATED: 'Контакт обновлён',
      CONTACT_DELETED: 'Контакт удалён',
      DEAL_CREATED: 'Создана новая сделка',
      DEAL_UPDATED: 'Сделка обновлена',
      DEAL_DELETED: 'Сделка удалена',
      DEAL_STATUS_CHANGED: 'Изменён статус сделки',
      DEAL_WON: 'Сделка выиграна',
      DEAL_LOST: 'Сделка проиграна',
      TASK_CREATED: 'Создана новая задача',
      TASK_UPDATED: 'Задача обновлена',
      TASK_COMPLETED: 'Задача выполнена',
      TASK_DELETED: 'Задача удалена',
      LEAD_CREATED: 'Создан новый лид',
      LEAD_UPDATED: 'Лид обновлён',
      LEAD_CONVERTED: 'Лид конвертирован',
      LEAD_DELETED: 'Лид удалён',
      MESSAGE_RECEIVED: 'Получено сообщение',
      MESSAGE_SENT: 'Отправлено сообщение',
      COMPANY_CREATED: 'Создана новая компания',
      COMPANY_UPDATED: 'Компания обновлена',
      COMPANY_DELETED: 'Компания удалена',
    };

    return descriptions[event] || event;
  }

  // ============ Helper Methods ============

  private async findWebhook(webhookId: string, organizationId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id: webhookId,
        organizationId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Вебхук не найден');
    }

    return webhook;
  }

  private mapToWebhookInfo(webhook: any): WebhookInfoDto {
    return {
      id: webhook.id,
      name: webhook.name,
      description: webhook.description,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      maxRetries: webhook.maxRetries,
      retryDelay: webhook.retryDelay,
      headers: webhook.headers as Record<string, string>,
      totalDeliveries: webhook.totalDeliveries,
      successDeliveries: webhook.successDeliveries,
      failedDeliveries: webhook.failedDeliveries,
      lastDeliveryAt: webhook.lastDeliveryAt,
      lastError: webhook.lastError,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      createdBy: webhook.createdBy,
    };
  }

  private mapToDeliveryDto(delivery: any): WebhookDeliveryDto {
    return {
      id: delivery.id,
      webhookId: delivery.webhookId,
      event: delivery.event,
      payload: delivery.payload,
      success: delivery.success,
      attempts: delivery.attempts,
      statusCode: delivery.statusCode,
      responseBody: delivery.responseBody,
      responseTime: delivery.responseTime,
      error: delivery.error,
      createdAt: delivery.createdAt,
      deliveredAt: delivery.deliveredAt,
    };
  }
}
