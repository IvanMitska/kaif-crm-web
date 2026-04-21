import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import {
  CreateWhatsAppAccountDto,
  UpdateWhatsAppAccountDto,
} from './dto/whatsapp-config.dto';
import {
  SendWhatsAppMessageDto,
  SendWhatsAppTemplateDto,
  SendWhatsAppMediaDto,
  LinkWhatsAppChatDto,
} from './dto/send-message.dto';
import { WhatsAppWebhookPayload } from './dto/whatsapp-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  // ============ Webhook (Public) ============

  @Get('webhook/:integrationId')
  @ApiOperation({ summary: 'Верификация вебхука WhatsApp (challenge)' })
  @ApiParam({ name: 'integrationId', description: 'ID интеграции' })
  @ApiQuery({ name: 'hub.mode', required: true })
  @ApiQuery({ name: 'hub.verify_token', required: true })
  @ApiQuery({ name: 'hub.challenge', required: true })
  @ApiResponse({ status: 200, description: 'Challenge подтверждён' })
  @ApiResponse({ status: 403, description: 'Неверный токен' })
  async verifyWebhook(
    @Param('integrationId') integrationId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): Promise<string> {
    this.logger.debug(`Webhook verification for integration ${integrationId}`);

    if (mode !== 'subscribe') {
      throw new BadRequestException('Invalid mode');
    }

    const isValid = await this.whatsappService.verifyWebhookToken(integrationId, token);
    if (!isValid) {
      throw new BadRequestException('Invalid verify token');
    }

    return challenge;
  }

  @Post('webhook/:integrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вебхук для приёма сообщений от WhatsApp' })
  @ApiParam({ name: 'integrationId', description: 'ID интеграции' })
  @ApiResponse({ status: 200, description: 'Обработано' })
  async handleWebhook(
    @Param('integrationId') integrationId: string,
    @Body() payload: WhatsAppWebhookPayload,
  ) {
    this.logger.debug(`Webhook received for integration ${integrationId}`);

    try {
      await this.whatsappService.processWebhook(integrationId, payload);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Webhook processing error: ${error.message}`);
      // Always return 200 to WhatsApp to prevent retries
    }

    return { status: 'ok' };
  }

  // ============ Account Management (Protected) ============

  @Get('accounts')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список WhatsApp аккаунтов' })
  @ApiResponse({ status: 200, description: 'Список аккаунтов' })
  getAccounts(@CurrentOrg() organizationId: string) {
    return this.whatsappService.getAccounts(organizationId);
  }

  @Get('accounts/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию об аккаунте' })
  @ApiResponse({ status: 200, description: 'Информация об аккаунте' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  getAccount(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.whatsappService.getAccount(id, organizationId);
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подключить WhatsApp аккаунт' })
  @ApiResponse({ status: 201, description: 'Аккаунт подключен' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  createAccount(
    @Body() dto: CreateWhatsAppAccountDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.whatsappService.createAccount(dto, organizationId);
  }

  @Patch('accounts/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить настройки аккаунта' })
  @ApiResponse({ status: 200, description: 'Аккаунт обновлён' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppAccountDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.whatsappService.updateAccount(id, dto, organizationId);
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить аккаунт' })
  @ApiResponse({ status: 200, description: 'Аккаунт удалён' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  async deleteAccount(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    await this.whatsappService.deleteAccount(id, organizationId);
    return { message: 'Аккаунт удалён' };
  }

  // ============ Messaging ============

  @Post('send')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить текстовое сообщение в WhatsApp' })
  @ApiResponse({ status: 200, description: 'Сообщение отправлено' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  @ApiResponse({ status: 400, description: 'Окно разговора закрыто' })
  sendMessage(
    @Body() dto: SendWhatsAppMessageDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendMessage(dto, organizationId, userId);
  }

  @Post('send/template')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить шаблонное сообщение в WhatsApp' })
  @ApiResponse({ status: 200, description: 'Шаблон отправлен' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  sendTemplate(
    @Body() dto: SendWhatsAppTemplateDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendTemplate(dto, organizationId, userId);
  }

  @Post('send/media')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить медиафайл в WhatsApp' })
  @ApiResponse({ status: 200, description: 'Медиа отправлено' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  @ApiResponse({ status: 400, description: 'Окно разговора закрыто' })
  sendMedia(
    @Body() dto: SendWhatsAppMediaDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendMedia(dto, organizationId, userId);
  }

  // ============ Chat Management ============

  @Get('chats')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все WhatsApp чаты' })
  @ApiQuery({ name: 'integrationId', required: false, description: 'Фильтр по аккаунту' })
  @ApiResponse({ status: 200, description: 'Список чатов' })
  getChats(
    @CurrentOrg() organizationId: string,
    @Query('integrationId') integrationId?: string,
  ) {
    return this.whatsappService.getChats(organizationId, integrationId);
  }

  @Get('chats/unlinked')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить несвязанные WhatsApp чаты' })
  @ApiResponse({ status: 200, description: 'Список чатов' })
  getUnlinkedChats(@CurrentOrg() organizationId: string) {
    return this.whatsappService.getUnlinkedChats(organizationId);
  }

  @Post('chats/link')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Связать WhatsApp чат с контактом' })
  @ApiResponse({ status: 200, description: 'Чат связан' })
  @ApiResponse({ status: 404, description: 'Чат или контакт не найден' })
  async linkChat(
    @Body() dto: LinkWhatsAppChatDto,
    @CurrentOrg() organizationId: string,
  ) {
    await this.whatsappService.linkChatToContact(dto, organizationId);
    return { message: 'Чат связан с контактом' };
  }
}
