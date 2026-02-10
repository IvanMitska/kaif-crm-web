import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateAutomationDto {
  @ApiProperty({ description: 'Название автоматизации' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Описание автоматизации' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Триггер автоматизации' })
  @IsObject()
  trigger: any;

  @ApiPropertyOptional({ description: 'Условия выполнения' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiProperty({ description: 'Действия автоматизации' })
  @IsObject()
  actions: any;

  @ApiPropertyOptional({ description: 'Активна ли автоматизация' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}