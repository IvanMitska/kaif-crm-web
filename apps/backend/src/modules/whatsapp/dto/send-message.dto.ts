import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum WhatsAppMessageTypeEnum {
  TEXT = 'text',
  TEMPLATE = 'template',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  LOCATION = 'location',
  INTERACTIVE = 'interactive',
}

export class SendWhatsAppMessageDto {
  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'ID интеграции (если несколько аккаунтов)' })
  @IsString()
  @IsOptional()
  integrationId?: string;

  @ApiPropertyOptional({ description: 'URL превью ссылки' })
  @IsOptional()
  previewUrl?: boolean;
}

export class SendWhatsAppTemplateDto {
  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ description: 'Название шаблона' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({ description: 'Код языка шаблона', example: 'ru' })
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @ApiPropertyOptional({ description: 'Компоненты шаблона (параметры)' })
  @IsArray()
  @IsOptional()
  components?: WhatsAppTemplateComponent[];

  @ApiPropertyOptional({ description: 'ID интеграции' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}

export class WhatsAppTemplateComponent {
  @ApiProperty({ enum: ['header', 'body', 'button'] })
  type: 'header' | 'body' | 'button';

  @ApiPropertyOptional()
  sub_type?: 'quick_reply' | 'url';

  @ApiPropertyOptional()
  index?: number;

  @ApiPropertyOptional()
  parameters?: WhatsAppTemplateParameter[];
}

export class WhatsAppTemplateParameter {
  @ApiProperty({ enum: ['text', 'currency', 'date_time', 'image', 'document', 'video'] })
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';

  @ApiPropertyOptional()
  text?: string;

  @ApiPropertyOptional()
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };

  @ApiPropertyOptional()
  date_time?: {
    fallback_value: string;
  };

  @ApiPropertyOptional()
  image?: { link: string };

  @ApiPropertyOptional()
  document?: { link: string; filename?: string };

  @ApiPropertyOptional()
  video?: { link: string };
}

export class SendWhatsAppMediaDto {
  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;

  @ApiProperty({ description: 'Тип медиа', enum: ['image', 'document', 'audio', 'video'] })
  @IsEnum(['image', 'document', 'audio', 'video'])
  @IsNotEmpty()
  mediaType: 'image' | 'document' | 'audio' | 'video';

  @ApiProperty({ description: 'URL медиафайла' })
  @IsString()
  @IsNotEmpty()
  mediaUrl: string;

  @ApiPropertyOptional({ description: 'Подпись к медиа' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ description: 'Имя файла (для документов)' })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiPropertyOptional({ description: 'ID интеграции' })
  @IsString()
  @IsOptional()
  integrationId?: string;
}

export class LinkWhatsAppChatDto {
  @ApiProperty({ description: 'ID WhatsApp чата' })
  @IsString()
  @IsNotEmpty()
  whatsappChatId: string;

  @ApiProperty({ description: 'ID контакта в CRM' })
  @IsString()
  @IsNotEmpty()
  contactId: string;
}

export class SendWhatsAppByPhoneDto {
  @ApiProperty({ description: 'Номер телефона получателя (с кодом страны)', example: '79991234567' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'ID интеграции' })
  @IsString()
  @IsNotEmpty()
  integrationId: string;
}
