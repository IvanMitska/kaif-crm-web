import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum WaitingListStatus {
  WAITING = 'WAITING',
  CONTACTED = 'CONTACTED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
}

export class CreateWaitingListItemDto {
  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Имя клиента (если без контакта)' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Телефон клиента (если без контакта)' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'ID ресурса' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Желаемая дата с' })
  @IsOptional()
  @IsDateString()
  preferredDateFrom?: string;

  @ApiPropertyOptional({ description: 'Желаемая дата по' })
  @IsOptional()
  @IsDateString()
  preferredDateTo?: string;

  @ApiPropertyOptional({ description: 'Желаемое время с', example: '09:00' })
  @IsOptional()
  @IsString()
  preferredTimeFrom?: string;

  @ApiPropertyOptional({ description: 'Желаемое время по', example: '18:00' })
  @IsOptional()
  @IsString()
  preferredTimeTo?: string;

  @ApiPropertyOptional({ description: 'Заметки' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWaitingListItemDto {
  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'ID ресурса' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Желаемая дата с' })
  @IsOptional()
  @IsDateString()
  preferredDateFrom?: string;

  @ApiPropertyOptional({ description: 'Желаемая дата по' })
  @IsOptional()
  @IsDateString()
  preferredDateTo?: string;

  @ApiPropertyOptional({ description: 'Желаемое время с' })
  @IsOptional()
  @IsString()
  preferredTimeFrom?: string;

  @ApiPropertyOptional({ description: 'Желаемое время по' })
  @IsOptional()
  @IsString()
  preferredTimeTo?: string;

  @ApiPropertyOptional({ description: 'Заметки' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: WaitingListStatus })
  @IsOptional()
  @IsEnum(WaitingListStatus)
  status?: WaitingListStatus;
}

export class WaitingListFilterDto {
  @ApiPropertyOptional({ enum: WaitingListStatus })
  @IsOptional()
  @IsEnum(WaitingListStatus)
  status?: WaitingListStatus;

  @ApiPropertyOptional({ description: 'ID ресурса' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'ID услуги' })
  @IsOptional()
  @IsString()
  serviceId?: string;
}
