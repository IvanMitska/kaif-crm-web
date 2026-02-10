import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateStageInPipelineDto {
  @ApiProperty({ example: 'Первичный контакт', description: 'Название этапа' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Цвет этапа' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreatePipelineDto {
  @ApiProperty({ example: 'Основная воронка', description: 'Название воронки' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание воронки' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Сделать воронку дефолтной', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Этапы воронки', type: [CreateStageInPipelineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageInPipelineDto)
  stages?: CreateStageInPipelineDto[];
}