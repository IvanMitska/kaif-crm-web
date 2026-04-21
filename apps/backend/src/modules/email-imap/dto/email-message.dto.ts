import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsEmail } from 'class-validator';

export class EmailMessageDto {
  id: string;
  emailAccountId: string;
  messageId: string;
  threadId?: string;
  fromEmail: string;
  fromName?: string;
  toEmails: string[];
  ccEmails: string[];
  subject?: string;
  snippet?: string;
  textBody?: string;
  htmlBody?: string;
  attachments?: EmailAttachmentDto[];
  isRead: boolean;
  isStarred: boolean;
  isSent: boolean;
  contactId?: string;
  contactName?: string;
  emailDate: Date;
  createdAt: Date;
}

export class EmailAttachmentDto {
  filename: string;
  mimeType: string;
  size: number;
  cid?: string; // Content-ID for inline attachments
  url?: string; // Download URL
}

export class EmailThreadDto {
  threadId: string;
  subject?: string;
  participants: string[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: Date;
  messages: EmailMessageDto[];
  contactId?: string;
  contactName?: string;
}

export class EmailListFilterDto {
  @ApiPropertyOptional({ description: 'ID аккаунта' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Только непрочитанные' })
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Только отмеченные' })
  @IsBoolean()
  @IsOptional()
  starredOnly?: boolean;

  @ApiPropertyOptional({ description: 'Только отправленные' })
  @IsBoolean()
  @IsOptional()
  sentOnly?: boolean;

  @ApiPropertyOptional({ description: 'Поиск по теме и содержимому' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Пропустить записей', default: 0 })
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество записей', default: 50 })
  @IsOptional()
  take?: number;
}

export class SendEmailDto {
  @ApiProperty({ description: 'ID аккаунта отправителя' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'Email получателей' })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  to: string[];

  @ApiPropertyOptional({ description: 'Email копии' })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({ description: 'Email скрытой копии' })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];

  @ApiProperty({ description: 'Тема письма' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ description: 'Текст письма (plain text)' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML содержимое письма' })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({ description: 'ID письма для ответа (Reply-To)' })
  @IsString()
  @IsOptional()
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'ID контакта для связи' })
  @IsString()
  @IsOptional()
  contactId?: string;
}

export class ReplyEmailDto {
  @ApiProperty({ description: 'ID исходного письма' })
  @IsString()
  @IsNotEmpty()
  originalMessageId: string;

  @ApiPropertyOptional({ description: 'Текст ответа (plain text)' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML содержимое ответа' })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiPropertyOptional({ description: 'Ответить всем (Reply All)', default: false })
  @IsBoolean()
  @IsOptional()
  replyAll?: boolean;
}

export class MarkEmailDto {
  @ApiProperty({ description: 'ID писем' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  messageIds: string[];

  @ApiPropertyOptional({ description: 'Пометить как прочитанное' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Пометить звёздочкой' })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @ApiPropertyOptional({ description: 'Архивировать' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class LinkEmailToContactDto {
  @ApiProperty({ description: 'ID письма' })
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @ApiProperty({ description: 'ID контакта' })
  @IsString()
  @IsNotEmpty()
  contactId: string;
}

export class SyncResultDto {
  success: boolean;
  accountId: string;
  newMessages: number;
  updatedMessages: number;
  errors: string[];
  syncedAt: Date;
}
