import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Типы триггеров автоматизации
export enum AutomationTriggerType {
  DEAL_STAGE_CHANGED = 'deal_stage_changed',
  DEAL_CREATED = 'deal_created',
  DEAL_WON = 'deal_won',
  DEAL_LOST = 'deal_lost',
  CONTACT_CREATED = 'contact_created',
  TASK_CREATED = 'task_created',
  TASK_OVERDUE = 'task_overdue',
  LEAD_CREATED = 'lead_created',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_CONVERTED = 'lead_converted',
}

// Типы действий автоматизации
export enum AutomationActionType {
  CREATE_TASK = 'create_task',
  SEND_NOTIFICATION = 'send_notification',
  UPDATE_FIELD = 'update_field',
  ASSIGN_OWNER = 'assign_owner',
  ADD_TAG = 'add_tag',
}

// Интерфейсы для типизации
export interface AutomationTrigger {
  type: AutomationTriggerType;
  config?: {
    fromStageId?: string;
    toStageId?: string;
    pipelineId?: string;
    [key: string]: any;
  };
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: any;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: {
    // Для CREATE_TASK
    taskTitle?: string;
    taskDescription?: string;
    taskDueDays?: number;
    taskPriority?: string;
    assignToOwner?: boolean;
    assignToUserId?: string;
    // Для SEND_NOTIFICATION
    notificationTitle?: string;
    notificationContent?: string;
    notifyOwner?: boolean;
    notifyUserIds?: string[];
    // Для UPDATE_FIELD
    fieldName?: string;
    fieldValue?: any;
    // Для ASSIGN_OWNER
    newOwnerId?: string;
    // Для ADD_TAG
    tagId?: string;
    [key: string]: any;
  };
}

export interface ExecutionContext {
  dealId?: string;
  contactId?: string;
  taskId?: string;
  leadId?: string;
  userId: string;
  organizationId: string;
  triggerData?: any;
}

export interface ExecutionResult {
  success: boolean;
  automationId: string;
  automationName: string;
  actionsExecuted: number;
  errors: string[];
  executedAt: Date;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) {}

  async create(createAutomationDto: CreateAutomationDto, organizationId: string) {
    return this.prisma.automation.create({
      data: {
        ...createAutomationDto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.automation.findFirst({
      where: { id, organizationId },
    });
  }

  async update(id: string, updateAutomationDto: UpdateAutomationDto, organizationId: string) {
    return this.prisma.automation.update({
      where: { id },
      data: updateAutomationDto,
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.automation.delete({
      where: { id },
    });
  }

  async execute(id: string, context: ExecutionContext): Promise<ExecutionResult> {
    const automation = await this.findOne(id, context.organizationId);

    if (!automation) {
      throw new NotFoundException('Автоматизация не найдена');
    }

    if (!automation.isActive) {
      return {
        success: false,
        automationId: id,
        automationName: automation.name,
        actionsExecuted: 0,
        errors: ['Автоматизация неактивна'],
        executedAt: new Date(),
      };
    }

    const result: ExecutionResult = {
      success: true,
      automationId: id,
      automationName: automation.name,
      actionsExecuted: 0,
      errors: [],
      executedAt: new Date(),
    };

    try {
      // Проверяем условия
      const conditions = automation.conditions as unknown as AutomationCondition[] | null;
      if (conditions && Array.isArray(conditions) && conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(conditions, context);
        if (!conditionsMet) {
          this.logger.debug(`Conditions not met for automation ${id}`);
          return {
            ...result,
            success: true,
            actionsExecuted: 0,
          };
        }
      }

      // Выполняем действия
      const actions = automation.actions as unknown as AutomationAction[];
      if (!actions || !Array.isArray(actions)) {
        result.errors.push('Нет действий для выполнения');
        result.success = false;
        return result;
      }

      for (const action of actions) {
        try {
          await this.executeAction(action, context);
          result.actionsExecuted++;
        } catch (error: any) {
          const errorMsg = `Ошибка выполнения действия ${action.type}: ${error?.message || 'Неизвестная ошибка'}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Обновляем время последнего запуска
      await this.prisma.automation.update({
        where: { id },
        data: { lastRunAt: new Date() },
      });

      result.success = result.errors.length === 0;

      this.logger.log(
        `Automation "${automation.name}" executed: ${result.actionsExecuted} actions, ${result.errors.length} errors`
      );

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to execute automation ${id}: ${error?.message}`);
      result.success = false;
      result.errors.push(error?.message || 'Неизвестная ошибка');
      return result;
    }
  }

  async executeByTrigger(
    triggerType: AutomationTriggerType,
    context: ExecutionContext,
    triggerConfig?: Record<string, any>,
  ): Promise<ExecutionResult[]> {
    // Находим все активные автоматизации с данным триггером
    const automations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        organizationId: context.organizationId,
      },
    });

    const results: ExecutionResult[] = [];

    for (const automation of automations) {
      const trigger = automation.trigger as unknown as AutomationTrigger;

      if (trigger?.type !== triggerType) {
        continue;
      }

      // Проверяем конфигурацию триггера
      if (triggerConfig && trigger.config) {
        const configMatches = this.matchTriggerConfig(trigger.config, triggerConfig);
        if (!configMatches) {
          continue;
        }
      }

      const result = await this.execute(automation.id, {
        ...context,
        triggerData: triggerConfig,
      });
      results.push(result);
    }

    return results;
  }

  private matchTriggerConfig(
    automationConfig: Record<string, any>,
    triggerConfig: Record<string, any>,
  ): boolean {
    // Проверяем совпадение конфигурации триггера
    for (const [key, value] of Object.entries(automationConfig)) {
      if (value === undefined || value === null || value === '') {
        continue; // Пропускаем пустые значения (wildcard)
      }
      if (triggerConfig[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async evaluateConditions(
    conditions: AutomationCondition[],
    context: ExecutionContext,
  ): Promise<boolean> {
    // Получаем данные для проверки условий
    let entity: any = null;

    if (context.dealId) {
      entity = await this.prisma.deal.findUnique({
        where: { id: context.dealId },
        include: { contact: true, company: true, stage: true },
      });
    } else if (context.contactId) {
      entity = await this.prisma.contact.findUnique({
        where: { id: context.contactId },
        include: { company: true },
      });
    } else if (context.taskId) {
      entity = await this.prisma.task.findUnique({
        where: { id: context.taskId },
      });
    } else if (context.leadId) {
      entity = await this.prisma.lead.findUnique({
        where: { id: context.leadId },
      });
    }

    if (!entity) {
      return false;
    }

    // Проверяем все условия (AND логика)
    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(entity, condition.field);
      const matches = this.evaluateCondition(fieldValue, condition.operator, condition.value);

      if (!matches) {
        return false;
      }
    }

    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(
    fieldValue: any,
    operator: AutomationCondition['operator'],
    conditionValue: any,
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue || '').toLowerCase().includes(String(conditionValue || '').toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return false;
    }
  }

  private async executeAction(action: AutomationAction, context: ExecutionContext): Promise<void> {
    switch (action.type) {
      case AutomationActionType.CREATE_TASK:
        await this.executeCreateTask(action.config, context);
        break;

      case AutomationActionType.SEND_NOTIFICATION:
        await this.executeSendNotification(action.config, context);
        break;

      case AutomationActionType.UPDATE_FIELD:
        await this.executeUpdateField(action.config, context);
        break;

      case AutomationActionType.ASSIGN_OWNER:
        await this.executeAssignOwner(action.config, context);
        break;

      case AutomationActionType.ADD_TAG:
        await this.executeAddTag(action.config, context);
        break;

      default:
        throw new Error(`Неизвестный тип действия: ${action.type}`);
    }
  }

  private async executeCreateTask(
    config: AutomationAction['config'],
    context: ExecutionContext,
  ): Promise<void> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (config.taskDueDays || 1));

    // Определяем назначенного пользователя
    let assigneeId = config.assignToUserId;

    if (config.assignToOwner && context.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: context.dealId },
        select: { ownerId: true },
      });
      assigneeId = deal?.ownerId;
    } else if (config.assignToOwner && context.contactId) {
      const contact = await this.prisma.contact.findUnique({
        where: { id: context.contactId },
        select: { ownerId: true },
      });
      assigneeId = contact?.ownerId;
    }

    await this.prisma.task.create({
      data: {
        title: this.interpolateTemplate(config.taskTitle || 'Автоматическая задача', context),
        description: config.taskDescription ? this.interpolateTemplate(config.taskDescription, context) : undefined,
        dueDate,
        priority: (config.taskPriority as TaskPriority) || TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        assigneeId: assigneeId || context.userId,
        createdById: context.userId,
        organizationId: context.organizationId,
        dealId: context.dealId,
        contactId: context.contactId,
      },
    });

    this.logger.debug(`Created task from automation`);
  }

  private async executeSendNotification(
    config: AutomationAction['config'],
    context: ExecutionContext,
  ): Promise<void> {
    const userIds: string[] = [];

    // Определяем получателей
    if (config.notifyOwner) {
      if (context.dealId) {
        const deal = await this.prisma.deal.findUnique({
          where: { id: context.dealId },
          select: { ownerId: true },
        });
        if (deal?.ownerId) userIds.push(deal.ownerId);
      } else if (context.contactId) {
        const contact = await this.prisma.contact.findUnique({
          where: { id: context.contactId },
          select: { ownerId: true },
        });
        if (contact?.ownerId) userIds.push(contact.ownerId);
      }
    }

    if (config.notifyUserIds) {
      userIds.push(...config.notifyUserIds);
    }

    // Убираем дубликаты
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return;
    }

    const notifications = uniqueUserIds.map((userId) => ({
      type: 'automation',
      title: this.interpolateTemplate(config.notificationTitle || 'Уведомление', context),
      content: this.interpolateTemplate(config.notificationContent || '', context),
      userId,
      metadata: {
        automationTriggered: true,
        dealId: context.dealId,
        contactId: context.contactId,
      },
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    this.logger.debug(`Sent ${notifications.length} notifications from automation`);
  }

  private async executeUpdateField(
    config: AutomationAction['config'],
    context: ExecutionContext,
  ): Promise<void> {
    const { fieldName, fieldValue } = config;

    if (!fieldName) {
      throw new Error('fieldName is required for UPDATE_FIELD action');
    }

    if (context.dealId) {
      await this.prisma.deal.update({
        where: { id: context.dealId },
        data: { [fieldName]: fieldValue },
      });
    } else if (context.contactId) {
      await this.prisma.contact.update({
        where: { id: context.contactId },
        data: { [fieldName]: fieldValue },
      });
    }

    this.logger.debug(`Updated field ${fieldName} from automation`);
  }

  private async executeAssignOwner(
    config: AutomationAction['config'],
    context: ExecutionContext,
  ): Promise<void> {
    const { newOwnerId } = config;

    if (!newOwnerId) {
      throw new Error('newOwnerId is required for ASSIGN_OWNER action');
    }

    if (context.dealId) {
      await this.prisma.deal.update({
        where: { id: context.dealId },
        data: { ownerId: newOwnerId },
      });
    } else if (context.contactId) {
      await this.prisma.contact.update({
        where: { id: context.contactId },
        data: { ownerId: newOwnerId },
      });
    }

    this.logger.debug(`Assigned owner ${newOwnerId} from automation`);
  }

  private async executeAddTag(
    config: AutomationAction['config'],
    context: ExecutionContext,
  ): Promise<void> {
    const { tagId } = config;

    if (!tagId) {
      throw new Error('tagId is required for ADD_TAG action');
    }

    if (context.contactId) {
      await this.prisma.contact.update({
        where: { id: context.contactId },
        data: {
          tags: {
            connect: { id: tagId },
          },
        },
      });
    }

    this.logger.debug(`Added tag ${tagId} from automation`);
  }

  private interpolateTemplate(template: string, context: ExecutionContext): string {
    // Простая интерполяция шаблонов
    // Поддерживает {{dealId}}, {{contactId}}, {{leadId}}, {{date}}, и т.д.
    return template
      .replace(/\{\{dealId\}\}/g, context.dealId || '')
      .replace(/\{\{contactId\}\}/g, context.contactId || '')
      .replace(/\{\{taskId\}\}/g, context.taskId || '')
      .replace(/\{\{leadId\}\}/g, context.leadId || '')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('ru-RU'))
      .replace(/\{\{datetime\}\}/g, new Date().toLocaleString('ru-RU'));
  }

  async getActiveAutomations(organizationId: string) {
    return this.prisma.automation.findMany({
      where: {
        isActive: true,
        organizationId,
      },
    });
  }

  async getAutomationsByTrigger(triggerType: AutomationTriggerType, organizationId: string) {
    const automations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        organizationId,
      },
    });

    return automations.filter((a) => {
      const trigger = a.trigger as unknown as AutomationTrigger;
      return trigger?.type === triggerType;
    });
  }
}