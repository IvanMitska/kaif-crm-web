import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateBookingDto {
  @ApiPropertyOptional({ description: 'Название записи', example: 'Консультация' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Описание записи' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Время начала', example: '2024-01-15T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Время окончания', example: '2024-01-15T10:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ enum: BookingStatus, default: BookingStatus.PENDING })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Цвет записи' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Заметки' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Метаданные' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'ID ресурса' })
  @IsString()
  resourceId: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID контакта (клиента)' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Имя клиента (для быстрого создания)' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Телефон клиента (для быстрого создания)' })
  @IsOptional()
  @IsString()
  clientPhone?: string;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ description: 'Название записи' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Описание записи' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Время начала' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Время окончания' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Цвет записи' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Заметки' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Метаданные' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID ресурса' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID контакта (клиента)' })
  @IsOptional()
  @IsString()
  contactId?: string;
}

export class BookingFilterDto {
  @ApiPropertyOptional({ description: 'ID ресурса' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'ID ресурсов (через запятую)' })
  @IsOptional()
  @IsString()
  resourceIds?: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Дата начала периода', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Дата окончания периода', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Пропустить записей', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество записей', default: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  take?: number;
}

export class CancelBookingDto {
  @ApiPropertyOptional({ description: 'Причина отмены' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AvailableSlotsDto {
  @ApiProperty({ description: 'ID ресурса' })
  @IsString()
  resourceId: string;

  @ApiProperty({ description: 'Дата для поиска слотов', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'ID услуги (для определения длительности)' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Желаемая длительность в минутах' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration?: number;
}
