import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStageDto {
  @ApiProperty({ example: 'Новый этап', description: 'Название этапа' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Цвет этапа' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Порядковый номер этапа' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}