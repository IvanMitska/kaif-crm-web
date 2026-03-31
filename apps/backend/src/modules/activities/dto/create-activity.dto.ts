import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ description: 'Тип активности' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Описание активности' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Метаданные активности' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'ID контакта' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'ID сделки' })
  @IsOptional()
  @IsString()
  dealId?: string;
}
