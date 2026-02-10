import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketsService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  // Отправка уведомления конкретному пользователю
  sendToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  // Отправка уведомления всем пользователям с определенной ролью
  sendToRole(role: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`role:${role}`).emit(event, data);
    }
  }

  // Отправка уведомления команде
  sendToTeam(teamId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`team:${teamId}`).emit(event, data);
    }
  }

  // Отправка в канал (для подписчиков на определенную сущность)
  sendToChannel(channel: string, entityId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`${channel}:${entityId}`).emit(event, data);
    }
  }

  // Широковещательная отправка всем подключенным клиентам
  broadcast(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  // События для CRM

  // Уведомление об обновлении сделки
  notifyDealUpdate(dealId: string, data: any) {
    this.sendToChannel('deal', dealId, 'deal:updated', {
      dealId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление об изменении этапа сделки
  notifyDealStageChanged(dealId: string, oldStage: string, newStage: string, userId: string) {
    this.sendToChannel('deal', dealId, 'deal:stageChanged', {
      dealId,
      oldStage,
      newStage,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление об обновлении контакта
  notifyContactUpdate(contactId: string, data: any) {
    this.sendToChannel('contact', contactId, 'contact:updated', {
      contactId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о назначении задачи
  notifyTaskAssigned(userId: string, task: any) {
    this.sendToUser(userId, 'task:assigned', {
      task,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о завершении задачи
  notifyTaskCompleted(taskId: string, completedBy: string) {
    this.sendToChannel('task', taskId, 'task:completed', {
      taskId,
      completedBy,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о новом сообщении
  notifyNewMessage(contactId: string, message: any) {
    this.sendToChannel('contact', contactId, 'message:new', {
      contactId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о новом комментарии
  notifyNewComment(entityType: string, entityId: string, comment: any) {
    this.sendToChannel(entityType, entityId, 'comment:new', {
      entityType,
      entityId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  // Системные уведомления
  sendNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification:new', {
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о присутствии пользователя
  notifyUserPresence(userId: string, status: 'online' | 'away' | 'busy' | 'offline') {
    this.broadcast('presence:update', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о печати
  notifyTyping(channel: string, entityId: string, userId: string, isTyping: boolean) {
    this.sendToChannel(channel, entityId, 'typing:status', {
      userId,
      isTyping,
      channel,
      entityId,
      timestamp: new Date().toISOString(),
    });
  }

  // Групповые уведомления для дашборда
  notifyDashboardUpdate(data: any) {
    this.sendToRole('ADMIN', 'dashboard:update', data);
    this.sendToRole('SUPERVISOR', 'dashboard:update', data);
  }

  // Уведомление об изменении в воронке продаж
  notifyPipelineUpdate(pipelineId: string, data: any) {
    this.sendToChannel('pipeline', pipelineId, 'pipeline:updated', {
      pipelineId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Уведомление о новом лиде
  notifyNewLead(lead: any) {
    this.sendToRole('MANAGER', 'lead:new', {
      lead,
      timestamp: new Date().toISOString(),
    });
    this.sendToRole('SUPERVISOR', 'lead:new', {
      lead,
      timestamp: new Date().toISOString(),
    });
  }

  // Массовые уведомления
  sendBulkNotifications(notifications: Array<{ userId: string; data: any }>) {
    notifications.forEach(({ userId, data }) => {
      this.sendNotification(userId, data);
    });
  }
}