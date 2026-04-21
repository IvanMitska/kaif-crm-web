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
  CreateTelegramBotDto,
  UpdateTelegramBotDto,
  TelegramBotInfoDto,
} from './dto/telegram-config.dto';
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramApiResponse,
  TelegramBotInfo,
  SendMessageOptions,
} from './dto/telegram-webhook.dto';
import { SendTelegramMessageDto, LinkTelegramChatDto } from './dto/send-message.dto';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly telegramApiUrl = 'https://api.telegram.org/bot';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

  // ============ Bot Management ============

  async createBot(dto: CreateTelegramBotDto, organizationId: string): Promise<TelegramBotInfoDto> {
    // Validate bot token by calling getMe
    const botInfo = await this.validateBotToken(dto.botToken);

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create integration config
    const integration = await this.prisma.integrationConfig.create({
      data: {
        organizationId,
        type: IntegrationType.TELEGRAM,
        name: dto.name,
        isActive: true,
        credentials: {
          botToken: dto.botToken,
          botUsername: botInfo.username,
          botId: botInfo.id,
        },
        settings: {
          welcomeMessage: dto.welcomeMessage || null,
          autoCreateContact: dto.autoCreateContact ?? true,
        },
        webhookSecret,
      },
    });

    // Set up webhook
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const webhookUrl = `${baseUrl}/api/telegram/webhook/${integration.id}`;

    try {
      await this.setWebhook(dto.botToken, webhookUrl, webhookSecret);

      await this.prisma.integrationConfig.update({
        where: { id: integration.id },
        data: { webhookUrl },
      });
    } catch (err) {
      const error = err as Error;
      this.logger.warn(`Failed to set webhook: ${error.message}. Bot created without webhook.`);
    }

    this.logger.log(`Telegram bot created: ${botInfo.username} for organization ${organizationId}`);

    return this.mapToTelegramBotInfo(integration, botInfo.username);
  }

  async updateBot(
    integrationId: string,
    dto: UpdateTelegramBotDto,
    organizationId: string,
  ): Promise<TelegramBotInfoDto> {
    const integration = await this.findIntegration(integrationId, organizationId);

    const credentials = integration.credentials as any;
    const settings = integration.settings as any;

    // If token is being updated, validate it
    let newBotUsername = credentials?.botUsername;
    if (dto.botToken && dto.botToken !== credentials?.botToken) {
      const botInfo = await this.validateBotToken(dto.botToken);
      newBotUsername = botInfo.username;

      // Update webhook with new token
      if (integration.webhookUrl) {
        await this.setWebhook(dto.botToken, integration.webhookUrl, integration.webhookSecret);
      }
    }

    const updated = await this.prisma.integrationConfig.update({
      where: { id: integrationId },
      data: {
        name: dto.name ?? integration.name,
        isActive: dto.isActive ?? integration.isActive,
        credentials: {
          ...credentials,
          ...(dto.botToken ? { botToken: dto.botToken, botUsername: newBotUsername } : {}),
        },
        settings: {
          ...settings,
          ...(dto.welcomeMessage !== undefined ? { welcomeMessage: dto.welcomeMessage } : {}),
          ...(dto.autoCreateContact !== undefined ? { autoCreateContact: dto.autoCreateContact } : {}),
        },
      },
    });

    return this.mapToTelegramBotInfo(updated, newBotUsername);
  }

  async deleteBot(integrationId: string, organizationId: string): Promise<void> {
    const integration = await this.findIntegration(integrationId, organizationId);
    const credentials = integration.credentials as any;

    // Remove webhook
    if (credentials?.botToken) {
      try {
        await this.deleteWebhook(credentials.botToken);
      } catch (err) {
        const error = err as Error;
        this.logger.warn(`Failed to delete webhook: ${error.message}`);
      }
    }

    await this.prisma.integrationConfig.delete({
      where: { id: integrationId },
    });

    this.logger.log(`Telegram bot deleted: ${integrationId}`);
  }

  async getBots(organizationId: string): Promise<TelegramBotInfoDto[]> {
    const integrations = await this.prisma.integrationConfig.findMany({
      where: {
        organizationId,
        type: IntegrationType.TELEGRAM,
      },
      orderBy: { createdAt: 'desc' },
    });

    return integrations.map((i) => {
      const credentials = i.credentials as any;
      return this.mapToTelegramBotInfo(i, credentials?.botUsername);
    });
  }

  async getBot(integrationId: string, organizationId: string): Promise<TelegramBotInfoDto> {
    const integration = await this.findIntegration(integrationId, organizationId);
    const credentials = integration.credentials as any;
    return this.mapToTelegramBotInfo(integration, credentials?.botUsername);
  }

  // ============ Webhook Processing ============

  async processWebhook(integrationId: string, update: TelegramUpdate, webhookSecret?: string): Promise<void> {
    const integration = await this.prisma.integrationConfig.findUnique({
      where: { id: integrationId },
      include: { organization: true },
    });

    if (!integration || integration.type !== IntegrationType.TELEGRAM) {
      throw new NotFoundException('Интеграция не найдена');
    }

    if (!integration.isActive) {
      this.logger.warn(`Webhook received for inactive bot: ${integrationId}`);
      return;
    }

    // Process message
    const message = update.message || update.edited_message;
    if (message) {
      await this.processIncomingMessage(integration, message);
    }

    // Process callback query (for inline buttons)
    if (update.callback_query) {
      await this.processCallbackQuery(integration, update.callback_query);
    }
  }

  private async processIncomingMessage(integration: any, message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id.toString();
    const credentials = integration.credentials as any;
    const settings = integration.settings as any;

    // Get or create Telegram chat record
    let telegramChat = await this.prisma.telegramChat.findUnique({
      where: {
        integrationId_telegramChatId: {
          integrationId: integration.id,
          telegramChatId: chatId,
        },
      },
      include: { contact: true },
    });

    const isNewChat = !telegramChat;

    if (!telegramChat) {
      // Create new chat record
      telegramChat = await this.prisma.telegramChat.create({
        data: {
          integrationId: integration.id,
          telegramChatId: chatId,
          telegramUsername: message.from?.username,
          telegramFirstName: message.from?.first_name,
          telegramLastName: message.from?.last_name,
          chatType: message.chat.type,
        },
        include: { contact: true },
      });

      // Auto-create contact if enabled
      if (settings?.autoCreateContact && message.chat.type === 'private') {
        const contact = await this.createContactFromTelegram(integration.organizationId, message);
        if (contact) {
          telegramChat = await this.prisma.telegramChat.update({
            where: { id: telegramChat.id },
            data: { contactId: contact.id },
            include: { contact: true },
          });
        }
      }

      // Send welcome message
      if (isNewChat && settings?.welcomeMessage && message.chat.type === 'private') {
        await this.sendMessageToChat(credentials.botToken, chatId, settings.welcomeMessage);
      }
    }

    // Update chat info
    await this.prisma.telegramChat.update({
      where: { id: telegramChat.id },
      data: {
        lastMessageAt: new Date(),
        telegramUsername: message.from?.username ?? telegramChat.telegramUsername,
        telegramFirstName: message.from?.first_name ?? telegramChat.telegramFirstName,
        telegramLastName: message.from?.last_name ?? telegramChat.telegramLastName,
      },
    });

    // Get message content
    const content = this.extractMessageContent(message);
    if (!content) {
      return; // Skip empty messages
    }

    // Save message to CRM if contact is linked
    if (telegramChat.contactId) {
      await this.messagesService.receiveMessage(
        telegramChat.contactId,
        content,
        'telegram',
        integration.organizationId,
        {
          telegramMessageId: message.message_id,
          telegramChatId: chatId,
          telegramUsername: message.from?.username,
          integrationId: integration.id,
        },
      );
    }

    // Update integration stats
    await this.prisma.integrationConfig.update({
      where: { id: integration.id },
      data: {
        messagesReceived: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    this.logger.log(`Telegram message received from chat ${chatId}`);
  }

  private async processCallbackQuery(integration: any, callbackQuery: any): Promise<void> {
    // Handle inline button callbacks
    this.logger.log(`Callback query received: ${callbackQuery.data}`);
    // Can be extended for button handling
  }

  // ============ Sending Messages ============

  async sendMessage(
    dto: SendTelegramMessageDto,
    organizationId: string,
    userId: string,
  ): Promise<{ success: boolean; messageId?: number }> {
    // Find contact's Telegram chat
    const telegramChat = await this.prisma.telegramChat.findFirst({
      where: {
        contactId: dto.contactId,
        integration: {
          organizationId,
          type: IntegrationType.TELEGRAM,
          isActive: true,
          ...(dto.integrationId ? { id: dto.integrationId } : {}),
        },
      },
      include: { integration: true },
    });

    if (!telegramChat) {
      throw new NotFoundException('Telegram чат для данного контакта не найден');
    }

    const credentials = telegramChat.integration.credentials as any;
    if (!credentials?.botToken) {
      throw new BadRequestException('Токен бота не настроен');
    }

    // Send message via Telegram API
    const result = await this.sendMessageToChat(
      credentials.botToken,
      telegramChat.telegramChatId,
      dto.text,
      { parse_mode: dto.parseMode },
    );

    if (result.ok) {
      // Save outbound message to CRM
      await this.messagesService.sendMessage(
        dto.contactId,
        dto.text,
        'telegram',
        userId,
        organizationId,
        {
          telegramMessageId: result.result?.message_id,
          telegramChatId: telegramChat.telegramChatId,
          integrationId: telegramChat.integration.id,
        },
      );

      // Update stats
      await this.prisma.integrationConfig.update({
        where: { id: telegramChat.integration.id },
        data: {
          messagesSent: { increment: 1 },
          lastActivityAt: new Date(),
        },
      });

      return { success: true, messageId: result.result?.message_id };
    }

    throw new BadRequestException(`Ошибка отправки: ${result.description}`);
  }

  async linkChatToContact(
    dto: LinkTelegramChatDto,
    organizationId: string,
  ): Promise<void> {
    // Find the Telegram chat
    const telegramChat = await this.prisma.telegramChat.findFirst({
      where: {
        id: dto.telegramChatId,
        integration: { organizationId },
      },
    });

    if (!telegramChat) {
      throw new NotFoundException('Telegram чат не найден');
    }

    // Verify contact exists
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    // Update link
    await this.prisma.telegramChat.update({
      where: { id: dto.telegramChatId },
      data: { contactId: dto.contactId },
    });

    this.logger.log(`Linked Telegram chat ${telegramChat.telegramChatId} to contact ${dto.contactId}`);
  }

  async getUnlinkedChats(organizationId: string) {
    return this.prisma.telegramChat.findMany({
      where: {
        contactId: null,
        integration: {
          organizationId,
          type: IntegrationType.TELEGRAM,
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

  // ============ Telegram API Methods ============

  private async validateBotToken(botToken: string): Promise<TelegramBotInfo> {
    const response = await this.callTelegramApi<TelegramBotInfo>(botToken, 'getMe');

    if (!response.ok || !response.result) {
      throw new BadRequestException('Неверный токен бота');
    }

    return response.result;
  }

  private async setWebhook(botToken: string, url: string, secret?: string): Promise<void> {
    const params: any = { url };
    if (secret) {
      params.secret_token = secret;
    }

    const response = await this.callTelegramApi(botToken, 'setWebhook', params);

    if (!response.ok) {
      throw new BadRequestException(`Ошибка установки вебхука: ${response.description}`);
    }
  }

  private async deleteWebhook(botToken: string): Promise<void> {
    await this.callTelegramApi(botToken, 'deleteWebhook');
  }

  private async sendMessageToChat(
    botToken: string,
    chatId: string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<TelegramApiResponse<TelegramMessage>> {
    return this.callTelegramApi<TelegramMessage>(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  private async callTelegramApi<T>(
    botToken: string,
    method: string,
    params?: Record<string, any>,
  ): Promise<TelegramApiResponse<T>> {
    const url = `${this.telegramApiUrl}${botToken}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: params ? JSON.stringify(params) : undefined,
      });

      return await response.json() as TelegramApiResponse<T>;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Telegram API error: ${error.message}`);
      return { ok: false, description: error.message };
    }
  }

  // ============ Helper Methods ============

  private async findIntegration(integrationId: string, organizationId: string) {
    const integration = await this.prisma.integrationConfig.findFirst({
      where: {
        id: integrationId,
        organizationId,
        type: IntegrationType.TELEGRAM,
      },
    });

    if (!integration) {
      throw new NotFoundException('Интеграция не найдена');
    }

    return integration;
  }

  private extractMessageContent(message: TelegramMessage): string | null {
    if (message.text) {
      return message.text;
    }
    if (message.caption) {
      return message.caption;
    }
    if (message.photo) {
      return '[Фото]';
    }
    if (message.document) {
      return `[Документ: ${message.document.file_name || 'файл'}]`;
    }
    if (message.voice) {
      return '[Голосовое сообщение]';
    }
    if (message.video) {
      return '[Видео]';
    }
    if (message.contact) {
      return `[Контакт: ${message.contact.first_name} ${message.contact.phone_number}]`;
    }
    if (message.location) {
      return `[Геолокация: ${message.location.latitude}, ${message.location.longitude}]`;
    }
    return null;
  }

  private async createContactFromTelegram(organizationId: string, message: TelegramMessage) {
    if (!message.from) return null;

    try {
      // Get first user from organization to be the owner
      const firstMember = await this.prisma.orgMember.findFirst({
        where: { organizationId },
        select: { userId: true },
      });

      if (!firstMember) return null;

      const contact = await this.prisma.contact.create({
        data: {
          firstName: message.from.first_name,
          lastName: message.from.last_name || '',
          source: 'TELEGRAM',
          organizationId,
          ownerId: firstMember.userId,
          createdById: firstMember.userId,
          customFields: {
            telegramUsername: message.from.username,
            telegramId: message.from.id,
          },
        },
      });

      this.logger.log(`Auto-created contact from Telegram: ${contact.id}`);
      return contact;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to create contact from Telegram: ${error.message}`);
      return null;
    }
  }

  private mapToTelegramBotInfo(integration: any, botUsername?: string): TelegramBotInfoDto {
    return {
      id: integration.id,
      name: integration.name,
      isActive: integration.isActive,
      botUsername,
      webhookUrl: integration.webhookUrl,
      messagesReceived: integration.messagesReceived,
      messagesSent: integration.messagesSent,
      lastActivityAt: integration.lastActivityAt,
      createdAt: integration.createdAt,
    };
  }
}
