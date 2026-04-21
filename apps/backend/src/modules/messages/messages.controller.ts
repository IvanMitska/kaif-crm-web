import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesFilterDto, ConversationsFilterDto } from './dto/messages-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ============ Conversations Endpoints ============

  @Get('conversations')
  @ApiOperation({ summary: 'Получить список диалогов' })
  @ApiResponse({ status: 200, description: 'Список диалогов с пагинацией и статистикой по каналам' })
  getConversations(
    @Query() filter: ConversationsFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.getConversations(filter, organizationId);
  }

  @Get('conversations/:contactId')
  @ApiOperation({ summary: 'Получить диалог с контактом' })
  @ApiResponse({ status: 200, description: 'Сообщения диалога с контактом' })
  getConversation(
    @Param('contactId') contactId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.getConversation(contactId, organizationId);
  }

  @Patch('conversations/:contactId/read')
  @ApiOperation({ summary: 'Отметить все сообщения диалога как прочитанные' })
  @ApiResponse({ status: 200, description: 'Количество отмеченных сообщений' })
  markConversationAsRead(
    @Param('contactId') contactId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.markConversationAsRead(contactId, organizationId);
  }

  // ============ Statistics Endpoints ============

  @Get('stats/channels')
  @ApiOperation({ summary: 'Получить статистику по каналам' })
  @ApiResponse({ status: 200, description: 'Статистика сообщений по каналам' })
  getChannelStats(@CurrentOrg() organizationId: string) {
    return this.messagesService.getChannelStats(organizationId);
  }

  @Get('stats/unread')
  @ApiOperation({ summary: 'Получить количество непрочитанных сообщений' })
  @ApiResponse({ status: 200, description: 'Количество непрочитанных сообщений' })
  getUnreadCount(
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.getUnreadCount(organizationId, userId);
  }

  // ============ Messages Endpoints ============

  @Post()
  @ApiOperation({ summary: 'Создать/отправить сообщение' })
  @ApiResponse({ status: 201, description: 'Сообщение создано' })
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.create(createMessageDto, organizationId, userId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Отправить сообщение контакту' })
  @ApiResponse({ status: 201, description: 'Сообщение отправлено' })
  sendMessage(
    @Body() body: { contactId: string; content: string; channel: string; metadata?: any },
    @CurrentOrg() organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.sendMessage(
      body.contactId,
      body.content,
      body.channel,
      userId,
      organizationId,
      body.metadata,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Получить все сообщения с фильтрацией' })
  @ApiResponse({ status: 200, description: 'Список сообщений с пагинацией' })
  findAll(
    @Query() filter: MessagesFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.findAll(filter, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сообщение по ID' })
  @ApiResponse({ status: 200, description: 'Сообщение' })
  @ApiResponse({ status: 404, description: 'Сообщение не найдено' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сообщение' })
  @ApiResponse({ status: 200, description: 'Сообщение обновлено' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.update(id, updateMessageDto, organizationId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить сообщение как прочитанное' })
  @ApiResponse({ status: 200, description: 'Сообщение отмечено как прочитанное' })
  markAsRead(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.markAsRead(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сообщение' })
  @ApiResponse({ status: 200, description: 'Сообщение удалено' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.remove(id, organizationId);
  }
}
