import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { WebhookEvent, WebhookStatus } from '@prisma/client';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Название вебхука', example: 'CRM Events' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Описание' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL для отправки событий', example: 'https://example.com/webhook' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Секретный ключ для подписи (HMAC)' })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiProperty({
    description: 'Список событий для подписки',
    enum: WebhookEvent,
    isArray: true,
    example: ['CONTACT_CREATED', 'DEAL_WON'],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsNotEmpty()
  events: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Максимальное количество повторных попыток', default: 3 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Задержка между повторами (секунды)', default: 60 })
  @IsInt()
  @Min(10)
  @Max(3600)
  @IsOptional()
  retryDelay?: number;

  @ApiPropertyOptional({ description: 'Дополнительные заголовки', example: { 'X-Custom-Header': 'value' } })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'Название вебхука' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Описание' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'URL для отправки событий' })
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Секретный ключ для подписи' })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({
    description: 'Список событий для подписки',
    enum: WebhookEvent,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @ApiPropertyOptional({ description: 'Статус вебхука', enum: WebhookStatus })
  @IsEnum(WebhookStatus)
  @IsOptional()
  status?: WebhookStatus;

  @ApiPropertyOptional({ description: 'Максимальное количество повторных попыток' })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Задержка между повторами (секунды)' })
  @IsInt()
  @Min(10)
  @Max(3600)
  @IsOptional()
  retryDelay?: number;

  @ApiPropertyOptional({ description: 'Дополнительные заголовки' })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

export class WebhookInfoDto {
  id: string;
  name: string;
  description?: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  maxRetries: number;
  retryDelay: number;
  headers?: Record<string, string>;
  totalDeliveries: number;
  successDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class WebhookDeliveryDto {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  success: boolean;
  attempts: number;
  statusCode?: number;
  responseBody?: string;
  responseTime?: number;
  error?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

export class WebhookDeliveryFilterDto {
  @ApiPropertyOptional({ description: 'ID вебхука' })
  @IsString()
  @IsOptional()
  webhookId?: string;

  @ApiPropertyOptional({ description: 'Тип события', enum: WebhookEvent })
  @IsEnum(WebhookEvent)
  @IsOptional()
  event?: WebhookEvent;

  @ApiPropertyOptional({ description: 'Только успешные' })
  @IsBoolean()
  @IsOptional()
  successOnly?: boolean;

  @ApiPropertyOptional({ description: 'Только неуспешные' })
  @IsBoolean()
  @IsOptional()
  failedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Пропустить записей', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({ description: 'Количество записей', default: 50 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;
}

export class TestWebhookDto {
  @ApiProperty({ description: 'ID вебхука' })
  @IsString()
  @IsNotEmpty()
  webhookId: string;

  @ApiPropertyOptional({ description: 'Тестовое событие', enum: WebhookEvent })
  @IsEnum(WebhookEvent)
  @IsOptional()
  event?: WebhookEvent;
}

// Event payload types for documentation
export class WebhookPayloadDto {
  @ApiProperty({ description: 'Уникальный ID события' })
  eventId: string;

  @ApiProperty({ description: 'Тип события', enum: WebhookEvent })
  event: WebhookEvent;

  @ApiProperty({ description: 'Время события (ISO 8601)' })
  timestamp: string;

  @ApiProperty({ description: 'ID организации' })
  organizationId: string;

  @ApiProperty({ description: 'Данные события' })
  data: any;
}

// Available webhook events list
export const WEBHOOK_EVENTS_INFO = {
  // Contact events
  CONTACT_CREATED: {
    description: 'Создан новый контакт',
    dataFields: ['id', 'firstName', 'lastName', 'email', 'phone'],
  },
  CONTACT_UPDATED: {
    description: 'Контакт обновлён',
    dataFields: ['id', 'changes'],
  },
  CONTACT_DELETED: {
    description: 'Контакт удалён',
    dataFields: ['id'],
  },

  // Deal events
  DEAL_CREATED: {
    description: 'Создана новая сделка',
    dataFields: ['id', 'title', 'amount', 'contactId', 'status'],
  },
  DEAL_UPDATED: {
    description: 'Сделка обновлена',
    dataFields: ['id', 'changes'],
  },
  DEAL_DELETED: {
    description: 'Сделка удалена',
    dataFields: ['id'],
  },
  DEAL_STATUS_CHANGED: {
    description: 'Изменён статус сделки',
    dataFields: ['id', 'previousStatus', 'newStatus'],
  },
  DEAL_WON: {
    description: 'Сделка выиграна',
    dataFields: ['id', 'title', 'amount'],
  },
  DEAL_LOST: {
    description: 'Сделка проиграна',
    dataFields: ['id', 'title', 'lostReason'],
  },

  // Task events
  TASK_CREATED: {
    description: 'Создана новая задача',
    dataFields: ['id', 'title', 'dueDate', 'assigneeId'],
  },
  TASK_UPDATED: {
    description: 'Задача обновлена',
    dataFields: ['id', 'changes'],
  },
  TASK_COMPLETED: {
    description: 'Задача выполнена',
    dataFields: ['id', 'title', 'completedAt'],
  },
  TASK_DELETED: {
    description: 'Задача удалена',
    dataFields: ['id'],
  },

  // Lead events
  LEAD_CREATED: {
    description: 'Создан новый лид',
    dataFields: ['id', 'firstName', 'lastName', 'source'],
  },
  LEAD_UPDATED: {
    description: 'Лид обновлён',
    dataFields: ['id', 'changes'],
  },
  LEAD_CONVERTED: {
    description: 'Лид конвертирован в контакт',
    dataFields: ['id', 'contactId'],
  },
  LEAD_DELETED: {
    description: 'Лид удалён',
    dataFields: ['id'],
  },

  // Message events
  MESSAGE_RECEIVED: {
    description: 'Получено входящее сообщение',
    dataFields: ['id', 'contactId', 'channel', 'content'],
  },
  MESSAGE_SENT: {
    description: 'Отправлено исходящее сообщение',
    dataFields: ['id', 'contactId', 'channel', 'content'],
  },

  // Company events
  COMPANY_CREATED: {
    description: 'Создана новая компания',
    dataFields: ['id', 'name', 'industry'],
  },
  COMPANY_UPDATED: {
    description: 'Компания обновлена',
    dataFields: ['id', 'changes'],
  },
  COMPANY_DELETED: {
    description: 'Компания удалена',
    dataFields: ['id'],
  },
};
