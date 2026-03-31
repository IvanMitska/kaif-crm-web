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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
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

  @Post()
  @ApiOperation({ summary: 'Создать новое сообщение' })
  create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.create(createMessageDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все сообщения' })
  findAll(
    @Query() filters: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.findAll(filters, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сообщение по ID' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сообщение' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.update(id, updateMessageDto, organizationId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить сообщение как прочитанное' })
  markAsRead(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.markAsRead(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сообщение' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.messagesService.remove(id, organizationId);
  }
}