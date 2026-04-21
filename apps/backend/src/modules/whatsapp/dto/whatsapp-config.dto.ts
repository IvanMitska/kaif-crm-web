import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateWhatsAppAccountDto {
  @ApiProperty({ description: 'Название аккаунта', example: 'Основной WhatsApp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  @IsString()
  @IsNotEmpty()
  businessAccountId: string;

  @ApiProperty({ description: 'Phone Number ID от Meta' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ description: 'Access Token от Meta' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiPropertyOptional({ description: 'Verify Token для вебхука (генерируется автоматически если не указан)' })
  @IsString()
  @IsOptional()
  verifyToken?: string;

  @ApiPropertyOptional({ description: 'Приветственное сообщение для новых чатов' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Автоматически создавать контакт при первом сообщении', default: true })
  @IsBoolean()
  @IsOptional()
  autoCreateContact?: boolean;
}

export class UpdateWhatsAppAccountDto {
  @ApiPropertyOptional({ description: 'Название аккаунта' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Access Token от Meta' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Приветственное сообщение' })
  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Автоматически создавать контакт' })
  @IsBoolean()
  @IsOptional()
  autoCreateContact?: boolean;

  @ApiPropertyOptional({ description: 'Активен ли аккаунт' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class WhatsAppAccountInfoDto {
  id: string;
  name: string;
  isActive: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  webhookUrl?: string;
  messagesReceived: number;
  messagesSent: number;
  lastActivityAt?: Date;
  createdAt: Date;
}
