import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import {
  CreateTelegramBotDto,
  UpdateTelegramBotDto,
} from './dto/telegram-config.dto';
import { SendTelegramMessageDto, LinkTelegramChatDto } from './dto/send-message.dto';
import { TelegramUpdate } from './dto/telegram-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) {}

  // ============ Webhook (Public) ============

  @Post('webhook/:integrationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вебхук для приёма сообщений от Telegram' })
  @ApiParam({ name: 'integrationId', description: 'ID интеграции' })
  @ApiResponse({ status: 200, description: 'Обработано' })
  async handleWebhook(
    @Param('integrationId') integrationId: string,
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    this.logger.debug(`Webhook received for integration ${integrationId}`);

    try {
      await this.telegramService.processWebhook(integrationId, update, secretToken);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Webhook processing error: ${error.message}`);
      // Always return 200 to Telegram to prevent retries
    }

    return { ok: true };
  }

  // ============ Bot Management (Protected) ============

  @Get('bots')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить список Telegram ботов' })
  @ApiResponse({ status: 200, description: 'Список ботов' })
  getBots(@CurrentOrg() organizationId: string) {
    return this.telegramService.getBots(organizationId);
  }

  @Get('bots/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить информацию о боте' })
  @ApiResponse({ status: 200, description: 'Информация о боте' })
  @ApiResponse({ status: 404, description: 'Бот не найден' })
  getBot(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.telegramService.getBot(id, organizationId);
  }

  @Post('bots')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать нового Telegram бота' })
  @ApiResponse({ status: 201, description: 'Бот создан' })
  @ApiResponse({ status: 400, description: 'Неверный токен бота' })
  createBot(
    @Body() dto: CreateTelegramBotDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.telegramService.createBot(dto, organizationId);
  }

  @Patch('bots/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить настройки бота' })
  @ApiResponse({ status: 200, description: 'Бот обновлён' })
  @ApiResponse({ status: 404, description: 'Бот не найден' })
  updateBot(
    @Param('id') id: string,
    @Body() dto: UpdateTelegramBotDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.telegramService.updateBot(id, dto, organizationId);
  }

  @Delete('bots/:id')
  @UseGuards(JwtAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить бота' })
  @ApiResponse({ status: 200, description: 'Бот удалён' })
  @ApiResponse({ status: 404, description: 'Бот не найден' })
  async deleteBot(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    await this.telegramService.deleteBot(id, organizationId);
    return { message: 'Бот удалён' };
  }

  // ============ Messaging ============

  @Post('send')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение в Telegram' })
  @ApiResponse({ status: 200, description: 'Сообщение отправлено' })
  @ApiResponse({ status: 404, description: 'Чат не найден' })
  sendMessage(
    @Body() dto: SendTelegramMessageDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.telegramService.sendMessage(dto, organizationId, userId);
  }

  // ============ Chat Management ============

  @Get('chats/unlinked')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить несвязанные Telegram чаты' })
  @ApiResponse({ status: 200, description: 'Список чатов' })
  getUnlinkedChats(@CurrentOrg() organizationId: string) {
    return this.telegramService.getUnlinkedChats(organizationId);
  }

  @Post('chats/link')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Связать Telegram чат с контактом' })
  @ApiResponse({ status: 200, description: 'Чат связан' })
  @ApiResponse({ status: 404, description: 'Чат или контакт не найден' })
  async linkChat(
    @Body() dto: LinkTelegramChatDto,
    @CurrentOrg() organizationId: string,
  ) {
    await this.telegramService.linkChatToContact(dto, organizationId);
    return { message: 'Чат связан с контактом' };
  }
}
