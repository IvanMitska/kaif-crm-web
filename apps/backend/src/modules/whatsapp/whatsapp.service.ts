import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { IntegrationType } from '@prisma/client';
import {
  CreateWhatsAppAccountDto,
  UpdateWhatsAppAccountDto,
  WhatsAppAccountInfoDto,
} from './dto/whatsapp-config.dto';
import {
  WhatsAppWebhookPayload,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppMessageStatus,
  WhatsAppSendMessageResponse,
  WhatsAppApiError,
} from './dto/whatsapp-webhook.dto';
import {
  SendWhatsAppMessageDto,
  SendWhatsAppTemplateDto,
  SendWhatsAppMediaDto,
  LinkWhatsAppChatDto,
} from './dto/send-message.dto';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly whatsappApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

  // ============ Account Management ============

  async createAccount(dto: CreateWhatsAppAccountDto, organizationId: string): Promise<WhatsAppAccountInfoDto> {
    // Validate access token by calling a simple endpoint
    await this.validateAccessToken(dto.accessToken, dto.phoneNumberId);

    // Generate verify token for webhook
    const verifyToken = dto.verifyToken || crypto.randomBytes(32).toString('hex');
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create integration config
    const integration = await this.prisma.integrationConfig.create({
      data: {
        organizationId,
        type: IntegrationType.WHATSAPP,
        name: dto.name,
        isActive: true,
        credentials: {
          accessToken: dto.accessToken,
          phoneNumberId: dto.phoneNumberId,
          businessAccountId: dto.businessAccountId,
          verifyToken,
        },
        settings: {
          welcomeMessage: dto.welcomeMessage || null,
          autoCreateContact: dto.autoCreateContact ?? true,
        },
        webhookSecret,
      },
    });

    // Generate webhook URL
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const webhookUrl = `${baseUrl}/api/whatsapp/webhook/${integration.id}`;

    await this.prisma.integrationConfig.update({
      where: { id: integration.id },
      data: { webhookUrl },
    });

    this.logger.log(`WhatsApp account created for organization ${organizationId}`);

    return this.mapToWhatsAppAccountInfo(integration);
  }

  async updateAccount(
    integrationId: string,
    dto: UpdateWhatsAppAccountDto,
    organizationId: string,
  ): Promise<WhatsAppAccountInfoDto> {
    const integration = await this.findIntegration(integrationId, organizationId);

    const credentials = integration.credentials as any;
    const settings = integration.settings as any;

    // If access token is being updated, validate it
    if (dto.accessToken && dto.accessToken !== credentials?.accessToken) {
      await this.validateAccessToken(dto.accessToken, credentials?.phoneNumberId);
    }

    const updated = await this.prisma.integrationConfig.update({
      where: { id: integrationId },
      data: {
        name: dto.name ?? integration.name,
        isActive: dto.isActive ?? integration.isActive,
        credentials: {
          ...credentials,
          ...(dto.accessToken ? { accessToken: dto.accessToken } : {}),
        },
        settings: {
          ...settings,
          ...(dto.welcomeMessage !== undefined ? { welcomeMessage: dto.welcomeMessage } : {}),
          ...(dto.autoCreateContact !== undefined ? { autoCreateContact: dto.autoCreateContact } : {}),
        },
      },
    });

    return this.mapToWhatsAppAccountInfo(updated);
  }

  async deleteAccount(integrationId: string, organizationId: string): Promise<void> {
    await this.findIntegration(integrationId, organizationId);

    await this.prisma.integrationConfig.delete({
      where: { id: integrationId },
    });

    this.logger.log(`WhatsApp account deleted: ${integrationId}`);
  }

  async getAccounts(organizationId: string): Promise<WhatsAppAccountInfoDto[]> {
    const integrations = await this.prisma.integrationConfig.findMany({
      where: {
        organizationId,
        type: IntegrationType.WHATSAPP,
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map((i) => this.mapToWhatsAppAccountInfo(i));
  }

  async getAccount(integrationId: string, organizationId: string): Promise<WhatsAppAccountInfoDto> {
    const integration = await this.findIntegration(integrationId, organizationId);
    return this.mapToWhatsAppAccountInfo(integration);
  }

  // ============ Webhook Processing ============

  verifyWebhook(integrationId: string, mode: string, token: string, challenge: string): string {
    // This is sync verification - we need to check the token synchronously
    // The actual verification against the database happens in the controller
    if (mode === 'subscribe') {
      return challenge;
    }
    throw new BadRequestException('Invalid verification mode');
  }

  async verifyWebhookToken(integrationId: string, token: string): Promise<boolean> {
    const integration = await this.prisma.integrationConfig.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.type !== IntegrationType.WHATSAPP) {
      return false;
    }

    const credentials = integration.credentials as any;
    return credentials?.verifyToken === token;
  }

  async processWebhook(integrationId: string, payload: WhatsAppWebhookPayload): Promise<void> {
    const integration = await this.prisma.integrationConfig.findUnique({
      where: { id: integrationId },
      include: { organization: true },
    });

    if (!integration || integration.type !== IntegrationType.WHATSAPP) {
      throw new NotFoundException('Интеграция не найдена');
    }

    if (!integration.isActive) {
      this.logger.warn(`Webhook received for inactive WhatsApp account: ${integrationId}`);
      return;
    }

    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const value = change.value;

          // Process incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              const contact = value.contacts?.find(c => c.wa_id === message.from);
              await this.processIncomingMessage(integration, message, contact);
            }
          }

          // Process message statuses
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.processMessageStatus(integration, status);
            }
          }
        }
      }
    }
  }

  private async processIncomingMessage(
    integration: any,
    message: WhatsAppMessage,
    contactInfo?: WhatsAppContact,
  ): Promise<void> {
    const waId = message.from;
    const credentials = integration.credentials as any;
    const settings = integration.settings as any;

    // Get or create WhatsApp chat record
    let whatsappChat = await this.prisma.whatsAppChat.findUnique({
      where: {
        integrationId_waId: {
          integrationId: integration.id,
          waId,
        },
      },
      include: { contact: true },
    });

    const isNewChat = !whatsappChat;

    if (!whatsappChat) {
      // Create new chat record
      whatsappChat = await this.prisma.whatsAppChat.create({
        data: {
          integrationId: integration.id,
          waId,
          phoneNumber: `+${waId}`,
          displayName: contactInfo?.profile?.name,
        },
        include: { contact: true },
      });

      // Auto-create contact if enabled
      if (settings?.autoCreateContact) {
        const contact = await this.createContactFromWhatsApp(
          integration.organizationId,
          waId,
          contactInfo?.profile?.name,
        );
        if (contact) {
          whatsappChat = await this.prisma.whatsAppChat.update({
            where: { id: whatsappChat.id },
            data: { contactId: contact.id },
            include: { contact: true },
          });
        }
      }

      // Send welcome message
      if (isNewChat && settings?.welcomeMessage) {
        await this.sendTextMessage(
          credentials.accessToken,
          credentials.phoneNumberId,
          waId,
          settings.welcomeMessage,
        );
      }
    }

    // Update chat info and conversation window
    const now = new Date();
    const windowExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    await this.prisma.whatsAppChat.update({
      where: { id: whatsappChat.id },
      data: {
        lastMessageAt: now,
        lastInboundAt: now,
        windowExpiresAt: windowExpires,
        displayName: contactInfo?.profile?.name ?? whatsappChat.displayName,
      },
    });

    // Get message content
    const content = this.extractMessageContent(message);
    if (!content) {
      return; // Skip empty messages
    }

    // Save message to CRM if contact is linked
    if (whatsappChat.contactId) {
      await this.messagesService.receiveMessage(
        whatsappChat.contactId,
        content,
        'whatsapp',
        integration.organizationId,
        {
          whatsappMessageId: message.id,
          whatsappChatId: whatsappChat.id,
          waId,
          integrationId: integration.id,
          messageType: message.type,
        },
      );
    }

    // Update integration stats
    await this.prisma.integrationConfig.update({
      where: { id: integration.id },
      data: {
        messagesReceived: { increment: 1 },
        lastActivityAt: now,
      },
    });

    this.logger.log(`WhatsApp message received from ${waId}`);
  }

  private async processMessageStatus(integration: any, status: WhatsAppMessageStatus): Promise<void> {
    // Log message status updates (sent, delivered, read, failed)
    this.logger.debug(`Message ${status.id} status: ${status.status}`);

    // Could be extended to update message status in the CRM
    // For now, just log the status
  }

  // ============ Sending Messages ============

  async sendMessage(
    dto: SendWhatsAppMessageDto,
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    // Find contact's WhatsApp chat
    const whatsappChat = await this.prisma.whatsAppChat.findFirst({
      where: {
        contactId: dto.contactId,
        integration: {
          organizationId,
          type: IntegrationType.WHATSAPP,
          isActive: true,
          ...(dto.integrationId ? { id: dto.integrationId } : {}),
        },
      },
      include: { integration: true },
    });

    if (!whatsappChat) {
      throw new NotFoundException('WhatsApp чат для данного контакта не найден');
    }

    // Check if conversation window is open
    const now = new Date();
    if (whatsappChat.windowExpiresAt && whatsappChat.windowExpiresAt < now) {
      throw new BadRequestException(
        'Окно разговора закрыто. Используйте шаблон сообщения для начала нового разговора.',
      );
    }

    const credentials = whatsappChat.integration.credentials as any;
    if (!credentials?.accessToken || !credentials?.phoneNumberId) {
      throw new BadRequestException('Учетные данные WhatsApp не настроены');
    }

    // Send message via WhatsApp API
    const result = await this.sendTextMessage(
      credentials.accessToken,
      credentials.phoneNumberId,
      whatsappChat.waId,
      dto.text,
      dto.previewUrl,
    );

    if (result.messages?.[0]?.id) {
      // Save outbound message to CRM
      await this.messagesService.sendMessage(
        dto.contactId,
        dto.text,
        'whatsapp',
        userId,
        organizationId,
        {
          whatsappMessageId: result.messages[0].id,
          whatsappChatId: whatsappChat.id,
          waId: whatsappChat.waId,
          integrationId: whatsappChat.integration.id,
        },
      );

      // Update stats
      await this.prisma.integrationConfig.update({
        where: { id: whatsappChat.integration.id },
        data: {
          messagesSent: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      // Update last message time
      await this.prisma.whatsAppChat.update({
        where: { id: whatsappChat.id },
        data: { lastMessageAt: new Date() },
      });

      return { success: true, messageId: result.messages[0].id };
    }

    throw new BadRequestException('Ошибка отправки сообщения');
  }

  async sendTemplate(
    dto: SendWhatsAppTemplateDto,
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    // Find contact's WhatsApp chat
    const whatsappChat = await this.prisma.whatsAppChat.findFirst({
      where: {
        contactId: dto.contactId,
        integration: {
          organizationId,
          type: IntegrationType.WHATSAPP,
          isActive: true,
          ...(dto.integrationId ? { id: dto.integrationId } : {}),
        },
      },
      include: { integration: true },
    });

    if (!whatsappChat) {
      throw new NotFoundException('WhatsApp чат для данного контакта не найден');
    }

    const credentials = whatsappChat.integration.credentials as any;
    if (!credentials?.accessToken || !credentials?.phoneNumberId) {
      throw new BadRequestException('Учетные данные WhatsApp не настроены');
    }

    // Build template message
    const templateMessage = {
      messaging_product: 'whatsapp',
      to: whatsappChat.waId,
      type: 'template',
      template: {
        name: dto.templateName,
        language: {
          code: dto.languageCode,
        },
        components: dto.components || [],
      },
    };

    const result = await this.callWhatsAppApi<WhatsAppSendMessageResponse>(
      credentials.accessToken,
      credentials.phoneNumberId,
      'messages',
      templateMessage,
    );

    if (result.messages?.[0]?.id) {
      // Save outbound message to CRM
      await this.messagesService.sendMessage(
        dto.contactId,
        `[Шаблон: ${dto.templateName}]`,
        'whatsapp',
        userId,
        organizationId,
        {
          whatsappMessageId: result.messages[0].id,
          whatsappChatId: whatsappChat.id,
          waId: whatsappChat.waId,
          integrationId: whatsappChat.integration.id,
          templateName: dto.templateName,
        },
      );

      // Update stats
      await this.prisma.integrationConfig.update({
        where: { id: whatsappChat.integration.id },
        data: {
          messagesSent: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      return { success: true, messageId: result.messages[0].id };
    }

    throw new BadRequestException('Ошибка отправки шаблона');
  }

  async sendMedia(
    dto: SendWhatsAppMediaDto,
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    // Find contact's WhatsApp chat
    const whatsappChat = await this.prisma.whatsAppChat.findFirst({
      where: {
        contactId: dto.contactId,
        integration: {
          organizationId,
          type: IntegrationType.WHATSAPP,
          isActive: true,
          ...(dto.integrationId ? { id: dto.integrationId } : {}),
        },
      },
      include: { integration: true },
    });

    if (!whatsappChat) {
      throw new NotFoundException('WhatsApp чат для данного контакта не найден');
    }

    // Check conversation window
    const now = new Date();
    if (whatsappChat.windowExpiresAt && whatsappChat.windowExpiresAt < now) {
      throw new BadRequestException('Окно разговора закрыто');
    }

    const credentials = whatsappChat.integration.credentials as any;
    if (!credentials?.accessToken || !credentials?.phoneNumberId) {
      throw new BadRequestException('Учетные данные WhatsApp не настроены');
    }

    // Build media message
    const mediaMessage: any = {
      messaging_product: 'whatsapp',
      to: whatsappChat.waId,
      type: dto.mediaType,
      [dto.mediaType]: {
        link: dto.mediaUrl,
        ...(dto.caption ? { caption: dto.caption } : {}),
        ...(dto.filename && dto.mediaType === 'document' ? { filename: dto.filename } : {}),
      },
    };

    const result = await this.callWhatsAppApi<WhatsAppSendMessageResponse>(
      credentials.accessToken,
      credentials.phoneNumberId,
      'messages',
      mediaMessage,
    );

    if (result.messages?.[0]?.id) {
      const messageText = dto.caption || `[${dto.mediaType.toUpperCase()}]`;

      // Save outbound message to CRM
      await this.messagesService.sendMessage(
        dto.contactId,
        messageText,
        'whatsapp',
        userId,
        organizationId,
        {
          whatsappMessageId: result.messages[0].id,
          whatsappChatId: whatsappChat.id,
          waId: whatsappChat.waId,
          integrationId: whatsappChat.integration.id,
          mediaType: dto.mediaType,
          mediaUrl: dto.mediaUrl,
        },
      );

      // Update stats
      await this.prisma.integrationConfig.update({
        where: { id: whatsappChat.integration.id },
        data: {
          messagesSent: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      return { success: true, messageId: result.messages[0].id };
    }

    throw new BadRequestException('Ошибка отправки медиа');
  }

  async linkChatToContact(dto: LinkWhatsAppChatDto, organizationId: string): Promise<void> {
    // Find the WhatsApp chat
    const whatsappChat = await this.prisma.whatsAppChat.findFirst({
      where: {
        id: dto.whatsappChatId,
        integration: { organizationId },
      },
    });

    if (!whatsappChat) {
      throw new NotFoundException('WhatsApp чат не найден');
    }

    // Verify contact exists
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    // Update link
    await this.prisma.whatsAppChat.update({
      where: { id: dto.whatsappChatId },
      data: { contactId: dto.contactId },
    });

    this.logger.log(`Linked WhatsApp chat ${whatsappChat.waId} to contact ${dto.contactId}`);
  }

  async getUnlinkedChats(organizationId: string) {
    return this.prisma.whatsAppChat.findMany({
      where: {
        contactId: null,
        integration: {
          organizationId,
          type: IntegrationType.WHATSAPP,
        },
      },
      include: {
        integration: {
          select: { name: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getChats(organizationId: string, integrationId?: string) {
    return this.prisma.whatsAppChat.findMany({
      where: {
        integration: {
          organizationId,
          type: IntegrationType.WHATSAPP,
          ...(integrationId ? { id: integrationId } : {}),
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        integration: {
          select: { id: true, name: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  // ============ WhatsApp API Methods ============

  private async validateAccessToken(accessToken: string, phoneNumberId: string): Promise<void> {
    try {
      const url = `${this.whatsappApiUrl}/${phoneNumberId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json() as WhatsAppApiError;
        throw new BadRequestException(
          `Ошибка валидации токена: ${error.error?.message || 'Неверный токен'}`,
        );
      }
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const error = err as Error;
      throw new BadRequestException(`Ошибка проверки токена: ${error.message}`);
    }
  }

  private async sendTextMessage(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    text: string,
    previewUrl?: boolean,
  ): Promise<WhatsAppSendMessageResponse> {
    const message = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl ?? false,
      },
    };

    return this.callWhatsAppApi<WhatsAppSendMessageResponse>(
      accessToken,
      phoneNumberId,
      'messages',
      message,
    );
  }

  private async callWhatsAppApi<T>(
    accessToken: string,
    phoneNumberId: string,
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.whatsappApiUrl}/${phoneNumberId}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as WhatsAppApiError;
        throw new BadRequestException(
          `WhatsApp API error: ${error.error?.message || 'Unknown error'}`,
        );
      }

      return data as T;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const error = err as Error;
      this.logger.error(`WhatsApp API error: ${error.message}`);
      throw new BadRequestException(`WhatsApp API error: ${error.message}`);
    }
  }

  // ============ Helper Methods ============

  private async findIntegration(integrationId: string, organizationId: string) {
    const integration = await this.prisma.integrationConfig.findFirst({
      where: {
        id: integrationId,
        organizationId,
        type: IntegrationType.WHATSAPP,
      },
    });

    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }

    return integration;
  }

  private extractMessageContent(message: WhatsAppMessage): string | null {
    switch (message.type) {
      case 'text':
        return message.text?.body || null;
      case 'image':
        return message.image?.caption || '[Изображение]';
      case 'video':
        return message.video?.caption || '[Видео]';
      case 'audio':
        return '[Аудио]';
      case 'document':
        return message.document?.caption || `[Документ: ${message.document?.filename || 'файл'}]`;
      case 'sticker':
        return '[Стикер]';
      case 'location':
        const loc = message.location;
        return loc ? `[Геолокация: ${loc.latitude}, ${loc.longitude}${loc.name ? ` - ${loc.name}` : ''}]` : '[Геолокация]';
      case 'contacts':
        const contact = message.contacts?.[0];
        return contact ? `[Контакт: ${contact.name.formatted_name}]` : '[Контакт]';
      case 'interactive':
        if (message.interactive?.button_reply) {
          return `[Кнопка: ${message.interactive.button_reply.title}]`;
        }
        if (message.interactive?.list_reply) {
          return `[Выбор: ${message.interactive.list_reply.title}]`;
        }
        return '[Интерактив]';
      case 'button':
        return message.button?.text || '[Кнопка]';
      case 'reaction':
        return message.reaction?.emoji || '[Реакция]';
      default:
        return '[Неизвестный тип сообщения]';
    }
  }

  private async createContactFromWhatsApp(
    organizationId: string,
    waId: string,
    displayName?: string,
  ) {
    try {
      // Get first user from organization to be the owner
      const firstMember = await this.prisma.orgMember.findFirst({
        where: { organizationId },
        select: { userId: true },
      });

      if (!firstMember) return null;

      // Parse display name
      const nameParts = (displayName || '').split(' ');
      const firstName = nameParts[0] || 'WhatsApp';
      const lastName = nameParts.slice(1).join(' ') || '';

      const contact = await this.prisma.contact.create({
        data: {
          firstName,
          lastName,
          phone: `+${waId}`,
          source: 'WHATSAPP',
          organizationId,
          ownerId: firstMember.userId,
          createdById: firstMember.userId,
          customFields: {
            whatsappId: waId,
            whatsappName: displayName,
          },
        },
      });

      this.logger.log(`Auto-created contact from WhatsApp: ${contact.id}`);
      return contact;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to create contact from WhatsApp: ${error.message}`);
      return null;
    }
  }

  private mapToWhatsAppAccountInfo(integration: any): WhatsAppAccountInfoDto {
    const credentials = integration.credentials as any;
    return {
      id: integration.id,
      name: integration.name,
      isActive: integration.isActive,
      phoneNumberId: credentials?.phoneNumberId,
      businessAccountId: credentials?.businessAccountId,
      webhookUrl: integration.webhookUrl,
      messagesReceived: integration.messagesReceived,
      messagesSent: integration.messagesSent,
      lastActivityAt: integration.lastActivityAt,
      createdAt: integration.createdAt,
    };
  }
}
