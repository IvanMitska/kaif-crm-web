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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmailImapService } from './email-imap.service';
import {
  CreateEmailAccountDto,
  UpdateEmailAccountDto,
  TestConnectionDto,
  EmailProviderPreset,
} from './dto/email-account.dto';
import {
  EmailListFilterDto,
  SendEmailDto,
  ReplyEmailDto,
  MarkEmailDto,
  LinkEmailToContactDto,
} from './dto/email-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Email IMAP')
@Controller('email-imap')
@UseGuards(JwtAuthGuard, OrganizationGuard)
@ApiBearerAuth()
export class EmailImapController {
  private readonly logger = new Logger(EmailImapController.name);

  constructor(private readonly emailImapService: EmailImapService) {}

  // ============ Account Management ============

  @Get('accounts')
  @ApiOperation({ summary: 'Получить список почтовых аккаунтов' })
  @ApiResponse({ status: 200, description: 'Список аккаунтов' })
  getAccounts(@CurrentOrg() organizationId: string) {
    return this.emailImapService.getAccounts(organizationId);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Получить информацию об аккаунте' })
  @ApiResponse({ status: 200, description: 'Информация об аккаунте' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  getAccount(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.getAccount(id, organizationId);
  }

  @Post('accounts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Подключить почтовый аккаунт' })
  @ApiResponse({ status: 201, description: 'Аккаунт подключен' })
  @ApiResponse({ status: 400, description: 'Ошибка подключения' })
  createAccount(
    @Body() dto: CreateEmailAccountDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.createAccount(dto, organizationId);
  }

  @Patch('accounts/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить настройки аккаунта' })
  @ApiResponse({ status: 200, description: 'Аккаунт обновлён' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateEmailAccountDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.updateAccount(id, dto, organizationId);
  }

  @Delete('accounts/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить аккаунт' })
  @ApiResponse({ status: 200, description: 'Аккаунт удалён' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  async deleteAccount(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    await this.emailImapService.deleteAccount(id, organizationId);
    return { message: 'Аккаунт удалён' };
  }

  @Post('accounts/test')
  @ApiOperation({ summary: 'Проверить подключение к IMAP серверу' })
  @ApiResponse({ status: 200, description: 'Подключение успешно' })
  @ApiResponse({ status: 400, description: 'Ошибка подключения' })
  testConnection(@Body() dto: TestConnectionDto) {
    return this.emailImapService.testConnection(dto);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Получить пресеты для популярных email провайдеров' })
  @ApiResponse({ status: 200, description: 'Список пресетов' })
  getProviderPresets() {
    return {
      gmail: EmailProviderPreset.GMAIL,
      outlook: EmailProviderPreset.OUTLOOK,
      yandex: EmailProviderPreset.YANDEX,
      mailru: EmailProviderPreset.MAILRU,
    };
  }

  // ============ Sync ============

  @Post('accounts/:id/sync')
  @ApiOperation({ summary: 'Синхронизировать почту для аккаунта' })
  @ApiResponse({ status: 200, description: 'Результат синхронизации' })
  @ApiResponse({ status: 404, description: 'Аккаунт не найден' })
  syncAccount(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.syncAccount(id, organizationId);
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Синхронизировать все почтовые аккаунты' })
  @ApiResponse({ status: 200, description: 'Результаты синхронизации' })
  syncAllAccounts(@CurrentOrg() organizationId: string) {
    return this.emailImapService.syncAllAccounts(organizationId);
  }

  // ============ Emails ============

  @Get('emails')
  @ApiOperation({ summary: 'Получить список писем' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'starredOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'sentOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Список писем' })
  getEmails(
    @Query() filter: EmailListFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.getEmails(filter, organizationId);
  }

  @Get('emails/:id')
  @ApiOperation({ summary: 'Получить письмо по ID' })
  @ApiResponse({ status: 200, description: 'Письмо' })
  @ApiResponse({ status: 404, description: 'Письмо не найдено' })
  getEmail(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.getEmail(id, organizationId);
  }

  @Post('emails/send')
  @ApiOperation({ summary: 'Отправить письмо' })
  @ApiResponse({ status: 200, description: 'Письмо отправлено' })
  @ApiResponse({ status: 400, description: 'Ошибка отправки' })
  sendEmail(
    @Body() dto: SendEmailDto,
    @CurrentUser('id') userId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.sendEmail(dto, userId, organizationId);
  }

  @Post('emails/reply')
  @ApiOperation({ summary: 'Ответить на письмо' })
  @ApiResponse({ status: 200, description: 'Ответ отправлен' })
  @ApiResponse({ status: 404, description: 'Исходное письмо не найдено' })
  replyToEmail(
    @Body() dto: ReplyEmailDto,
    @CurrentUser('id') userId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.emailImapService.replyToEmail(dto, userId, organizationId);
  }

  @Patch('emails/mark')
  @ApiOperation({ summary: 'Пометить письма (прочитано/звёздочка/архив)' })
  @ApiResponse({ status: 200, description: 'Письма обновлены' })
  async markEmails(
    @Body() dto: MarkEmailDto,
    @CurrentOrg() organizationId: string,
  ) {
    await this.emailImapService.markEmails(dto, organizationId);
    return { message: 'Письма обновлены' };
  }

  @Delete('emails')
  @ApiOperation({ summary: 'Удалить письма' })
  @ApiResponse({ status: 200, description: 'Письма удалены' })
  async deleteEmails(
    @Body() body: { messageIds: string[] },
    @CurrentOrg() organizationId: string,
  ) {
    await this.emailImapService.deleteEmails(body.messageIds, organizationId);
    return { message: 'Письма удалены' };
  }

  @Post('emails/link')
  @ApiOperation({ summary: 'Связать письмо с контактом' })
  @ApiResponse({ status: 200, description: 'Письмо связано' })
  @ApiResponse({ status: 404, description: 'Письмо или контакт не найден' })
  async linkEmailToContact(
    @Body() dto: LinkEmailToContactDto,
    @CurrentOrg() organizationId: string,
  ) {
    await this.emailImapService.linkEmailToContact(dto, organizationId);
    return { message: 'Письмо связано с контактом' };
  }

  // ============ Stats ============

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по email' })
  @ApiResponse({ status: 200, description: 'Статистика' })
  getStats(@CurrentOrg() organizationId: string) {
    return this.emailImapService.getEmailStats(organizationId);
  }
}
