import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ description: 'Название услуги', example: 'Консультация' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание услуги' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Длительность в минутах', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Type(() => Number)
  duration?: number;

  @ApiProperty({ description: 'Цена услуги', example: 1500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ description: 'Валюта', default: 'RUB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Цвет услуги', example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Активна ли услуга', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID ресурсов, привязанных к услуге', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Название услуги' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Описание услуги' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Длительность в минутах' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({ description: 'Цена услуги' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: 'Валюта' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Цвет услуги' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Активна ли услуга' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID ресурсов, привязанных к услуге', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];
}

export class ServiceFilterDto {
  @ApiPropertyOptional({ description: 'Только активные' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Поиск по имени' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID ресурса для фильтрации' })
  @IsOptional()
  @IsString()
  resourceId?: string;
}
