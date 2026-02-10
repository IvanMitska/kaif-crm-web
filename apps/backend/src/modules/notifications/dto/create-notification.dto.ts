import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Тип уведомления' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Заголовок уведомления' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Содержание уведомления' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Метаданные уведомления' })
  @IsOptional()
  metadata?: any;

  @ApiProperty({ description: 'ID пользователя' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Прочитано' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}