import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Канал сообщения' })
  @IsString()
  channel: string;

  @ApiProperty({ description: 'Направление сообщения (inbound/outbound)' })
  @IsString()
  direction: string;

  @ApiProperty({ description: 'Содержание сообщения' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Метаданные сообщения' })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'ID контакта' })
  @IsString()
  contactId: string;

  @ApiPropertyOptional({ description: 'ID пользователя' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Прочитано' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}