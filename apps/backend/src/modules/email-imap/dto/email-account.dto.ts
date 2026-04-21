import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsEmail, Min, Max } from 'class-validator';

export class CreateEmailAccountDto {
  @ApiProperty({ description: 'Название аккаунта', example: 'Рабочая почта' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email адрес', example: 'user@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Отображаемое имя', example: 'Иван Иванов' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ description: 'Пароль или App Password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  // IMAP Settings
  @ApiProperty({ description: 'IMAP сервер', example: 'imap.gmail.com' })
  @IsString()
  @IsNotEmpty()
  imapHost: string;

  @ApiPropertyOptional({ description: 'IMAP порт', default: 993 })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  imapPort?: number;

  @ApiPropertyOptional({ description: 'Использовать SSL/TLS для IMAP', default: true })
  @IsBoolean()
  @IsOptional()
  imapSecure?: boolean;

  // SMTP Settings (optional, for sending)
  @ApiPropertyOptional({ description: 'SMTP сервер', example: 'smtp.gmail.com' })
  @IsString()
  @IsOptional()
  smtpHost?: string;

  @ApiPropertyOptional({ description: 'SMTP порт', default: 587 })
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'Использовать STARTTLS для SMTP', default: false })
  @IsBoolean()
  @IsOptional()
  smtpSecure?: boolean;

  // Sync settings
  @ApiPropertyOptional({ description: 'Папка для синхронизации', default: 'INBOX' })
  @IsString()
  @IsOptional()
  syncFolder?: string;

  @ApiPropertyOptional({ description: 'Автоматически связывать письма с контактами', default: true })
  @IsBoolean()
  @IsOptional()
  autoLinkContacts?: boolean;
}

export class UpdateEmailAccountDto {
  @ApiPropertyOptional({ description: 'Название аккаунта' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Отображаемое имя' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Новый пароль' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Включить синхронизацию' })
  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Папка для синхронизации' })
  @IsString()
  @IsOptional()
  syncFolder?: string;

  @ApiPropertyOptional({ description: 'Активен ли аккаунт' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EmailAccountInfoDto {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  smtpHost?: string;
  smtpPort?: number;
  syncEnabled: boolean;
  syncFolder: string;
  lastSyncAt?: Date;
  lastSyncError?: string;
  emailsReceived: number;
  emailsSent: number;
  isActive: boolean;
  createdAt: Date;
}

// Provider presets for common email services
export class EmailProviderPreset {
  static readonly GMAIL = {
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
  };

  static readonly OUTLOOK = {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
  };

  static readonly YANDEX = {
    imapHost: 'imap.yandex.ru',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.yandex.ru',
    smtpPort: 587,
    smtpSecure: false,
  };

  static readonly MAILRU = {
    imapHost: 'imap.mail.ru',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.ru',
    smtpPort: 587,
    smtpSecure: false,
  };
}

export class TestConnectionDto {
  @ApiProperty({ description: 'Email адрес' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Пароль' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'IMAP сервер' })
  @IsString()
  @IsNotEmpty()
  imapHost: string;

  @ApiPropertyOptional({ description: 'IMAP порт', default: 993 })
  @IsInt()
  @IsOptional()
  imapPort?: number;

  @ApiPropertyOptional({ description: 'Использовать SSL/TLS', default: true })
  @IsBoolean()
  @IsOptional()
  imapSecure?: boolean;
}
