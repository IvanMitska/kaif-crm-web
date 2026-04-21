import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export class MessagesFilterDto {
  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ enum: MessageChannel, description: 'Канал сообщения' })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiPropertyOptional({ enum: MessageDirection, description: 'Направление сообщения' })
  @IsOptional()
  @IsEnum(MessageDirection)
  direction?: MessageDirection;

  @ApiPropertyOptional({ description: 'Только непрочитанные' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Поиск по содержимому' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Пропустить записей', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество записей', default: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  take?: number;
}

export class ConversationsFilterDto {
  @ApiPropertyOptional({ enum: MessageChannel, description: 'Фильтр по каналу' })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiPropertyOptional({ description: 'Поиск по имени контакта' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Только непрочитанные' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Пропустить записей', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество записей', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  take?: number;
}
