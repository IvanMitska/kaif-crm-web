import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ResourceType {
  SPECIALIST = 'SPECIALIST',
  ROOM = 'ROOM',
  EQUIPMENT = 'EQUIPMENT',
  VEHICLE = 'VEHICLE',
  OTHER = 'OTHER',
}

export enum ResourceCategory {
  MEDICAL = 'MEDICAL',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  SERVICES = 'SERVICES',
  CARS = 'CARS',
  ROOMS = 'ROOMS',
  OTHER = 'OTHER',
}

export class WorkingHoursDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  end?: string;
}

export class CreateResourceDto {
  @ApiProperty({ description: 'Название ресурса', example: 'Анна Иванова' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: ResourceType, default: ResourceType.SPECIALIST })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({ enum: ResourceCategory, default: ResourceCategory.SERVICES })
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @ApiPropertyOptional({ description: 'Цвет ресурса', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Аватар (инициалы)', example: 'АИ' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Описание ресурса' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Рабочие часы по дням недели' })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, WorkingHoursDto>;

  @ApiPropertyOptional({ description: 'Время перерыва' })
  @IsOptional()
  @IsObject()
  breakTime?: WorkingHoursDto;

  @ApiPropertyOptional({ description: 'Длительность слота в минутах', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Type(() => Number)
  slotDuration?: number;

  @ApiPropertyOptional({ description: 'Активен ли ресурс', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateResourceDto {
  @ApiPropertyOptional({ description: 'Название ресурса' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({ enum: ResourceCategory })
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @ApiPropertyOptional({ description: 'Цвет ресурса' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Аватар (инициалы)' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Описание ресурса' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Рабочие часы по дням недели' })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, WorkingHoursDto>;

  @ApiPropertyOptional({ description: 'Время перерыва' })
  @IsOptional()
  @IsObject()
  breakTime?: WorkingHoursDto;

  @ApiPropertyOptional({ description: 'Длительность слота в минутах' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Type(() => Number)
  slotDuration?: number;

  @ApiPropertyOptional({ description: 'Активен ли ресурс' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResourceFilterDto {
  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({ enum: ResourceCategory })
  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @ApiPropertyOptional({ description: 'Только активные' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Поиск по имени' })
  @IsOptional()
  @IsString()
  search?: string;
}
