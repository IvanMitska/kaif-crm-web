import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'Название тега' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Цвет тега (HEX)', default: '#6B7280' })
  @IsOptional()
  @IsString()
  color?: string;
}
