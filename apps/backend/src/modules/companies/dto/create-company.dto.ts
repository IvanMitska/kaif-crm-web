import { IsString, IsOptional, IsEmail, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'ООО "Рога и Копыта"', description: 'Название компании' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '7701234567', description: 'ИНН компании' })
  @IsOptional()
  @IsString()
  inn?: string;

  @ApiPropertyOptional({ example: '770101001', description: 'КПП компании' })
  @IsOptional()
  @IsString()
  kpp?: string;

  @ApiPropertyOptional({ example: '1027700123456', description: 'ОГРН компании' })
  @IsOptional()
  @IsString()
  ogrn?: string;

  @ApiPropertyOptional({ example: 'https://example.com', description: 'Веб-сайт компании' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'info@example.com', description: 'Email компании' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+74951234567', description: 'Телефон компании' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'г. Москва, ул. Пушкина, д. 1', description: 'Адрес компании' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Описание компании' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'IT', description: 'Отрасль' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '50-100', description: 'Размер компании' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Теги', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Кастомные поля', type: Object })
  @IsOptional()
  customFields?: Record<string, any>;
}