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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookDeliveryFilterDto,
  TestWebhookDto,
  WEBHOOK_EVENTS_INFO,
} from './dto/webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // ============ Webhook Management ============

  @Get()
  @ApiOperation({ summary: 'Получить список вебхуков' })
  @ApiResponse({ status: 200, description: 'Список вебхуков' })
  getWebhooks(@CurrentOrg() organizationId: string) {
    return this.webhooksService.getWebhooks(organizationId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Получить список доступных событий' })
  @ApiResponse({ status: 200, description: 'Список событий' })
  getAvailableEvents() {
    return this.webhooksService.getAvailableEvents();
  }

  @Get('events/info')
  @ApiOperation({ summary: 'Получить описание полей событий' })
  @ApiResponse({ status: 200, description: 'Описание событий' })
  getEventsInfo() {
    return WEBHOOK_EVENTS_INFO;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по вебхукам' })
  @ApiResponse({ status: 200, description: 'Статистика' })
  getStats(@CurrentOrg() organizationId: string) {
    return this.webhooksService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить информацию о вебхуке' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Информация о вебхуке' })
  @ApiResponse({ status: 404, description: 'Вебхук не найден' })
  getWebhook(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.getWebhook(id, organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать вебхук' })
  @ApiResponse({ status: 201, description: 'Вебхук создан' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  createWebhook(
    @Body() dto: CreateWebhookDto,
    @CurrentUser('id') userId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.createWebhook(dto, userId, organizationId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить вебхук' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Вебхук обновлён' })
  @ApiResponse({ status: 404, description: 'Вебхук не найден' })
  updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.updateWebhook(id, dto, organizationId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить вебхук' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Вебхук удалён' })
  @ApiResponse({ status: 404, description: 'Вебхук не найден' })
  async deleteWebhook(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    await this.webhooksService.deleteWebhook(id, organizationId);
    return { message: 'Вебхук удалён' };
  }

  // ============ Secret Management ============

  @Get(':id/secret')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить секретный ключ вебхука' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Секретный ключ' })
  getWebhookSecret(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.getWebhookSecret(id, organizationId);
  }

  @Post(':id/regenerate-secret')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Перегенерировать секретный ключ' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Новый секретный ключ' })
  regenerateSecret(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.regenerateSecret(id, organizationId);
  }

  // ============ Testing ============

  @Post(':id/test')
  @ApiOperation({ summary: 'Отправить тестовый запрос' })
  @ApiParam({ name: 'id', description: 'ID вебхука' })
  @ApiResponse({ status: 200, description: 'Результат теста' })
  testWebhook(
    @Param('id') id: string,
    @Body() dto: Partial<TestWebhookDto>,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.testWebhook(id, organizationId, dto.event);
  }

  // ============ Delivery History ============

  @Get('deliveries/list')
  @ApiOperation({ summary: 'Получить историю доставок' })
  @ApiResponse({ status: 200, description: 'История доставок' })
  getDeliveries(
    @Query() filter: WebhookDeliveryFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.getDeliveries(filter, organizationId);
  }

  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Получить информацию о доставке' })
  @ApiParam({ name: 'id', description: 'ID доставки' })
  @ApiResponse({ status: 200, description: 'Информация о доставке' })
  @ApiResponse({ status: 404, description: 'Доставка не найдена' })
  getDelivery(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.getDelivery(id, organizationId);
  }

  @Post('deliveries/:id/retry')
  @ApiOperation({ summary: 'Повторить доставку вручную' })
  @ApiParam({ name: 'id', description: 'ID доставки' })
  @ApiResponse({ status: 200, description: 'Результат повтора' })
  @ApiResponse({ status: 404, description: 'Доставка не найдена' })
  retryDelivery(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.webhooksService.retryDeliveryManual(id, organizationId);
  }
}
