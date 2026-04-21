import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendTelegramMessageDto {
  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'ID интеграции (если несколько ботов)' })
  @IsString()
  @IsOptional()
  integrationId?: string;

  @ApiPropertyOptional({ description: 'Режим разметки', enum: ['HTML', 'Markdown', 'MarkdownV2'] })
  @IsString()
  @IsOptional()
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export class SendTelegramMessageByChatIdDto {
  @ApiProperty({ description: 'Telegram Chat ID' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Режим разметки' })
  @IsString()
  @IsOptional()
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export class LinkTelegramChatDto {
  @ApiProperty({ description: 'ID Telegram чата' })
  @IsString()
  @IsNotEmpty()
  telegramChatId: string;

  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;
}
