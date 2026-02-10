import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactSource } from '@prisma/client';

export class CreateContactDto {
  @ApiProperty({ example: 'Иван', description: 'Имя контакта' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия контакта' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Иванович', description: 'Отчество контакта' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'ivan@example.com', description: 'Email контакта' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+79991234567', description: 'Телефон контакта' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+79991234568', description: 'Дополнительный телефон' })
  @IsOptional()
  @IsString()
  secondPhone?: string;

  @ApiPropertyOptional({ example: 'Менеджер по продажам', description: 'Должность' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Дата рождения' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: ContactSource, default: ContactSource.DIRECT })
  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;

  @ApiPropertyOptional({ description: 'Описание контакта' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID компании' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Теги', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Кастомные поля', type: Object })
  @IsOptional()
  customFields?: Record<string, any>;
}