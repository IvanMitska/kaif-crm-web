import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateTelegramBotDto {
  @ApiProperty({ description: 'Название бота', example: 'Основной бот поддержки' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Токен бота от @BotFather', example: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz' })
  @IsString()
  @IsNotEmpty()
  botToken: string;

  @ApiPropertyOptional({ description: 'Приветственное сообщение для новых чатов' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Автоматически создавать контакт при первом сообщении', default: true })
  @IsBoolean()
  @IsOptional()
  autoCreateContact?: boolean;
}

export class UpdateTelegramBotDto {
  @ApiPropertyOptional({ description: 'Название бота' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Токен бота' })
  @IsString()
  @IsOptional()
  botToken?: string;

  @ApiPropertyOptional({ description: 'Приветственное сообщение' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Автоматически создавать контакт' })
  @IsBoolean()
  @IsOptional()
  autoCreateContact?: boolean;

  @ApiPropertyOptional({ description: 'Активен ли бот' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TelegramBotInfoDto {
  id: string;
  name: string;
  isActive: boolean;
  botUsername?: string;
  webhookUrl?: string;
  messagesReceived: number;
  messagesSent: number;
  lastActivityAt?: Date;
  createdAt: Date;
}
