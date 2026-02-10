import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebsocketsService } from './websockets.service';
import { PrismaService } from '../../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  // Socket already has 'rooms' property, no need to override
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class WebsocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebsocketsGateway');
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private websocketsService: WebsocketsService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.websocketsService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
      
      if (!token) {
        throw new WsException('Токен авторизации не предоставлен');
      }

      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new WsException('Пользователь не найден');
      }

      client.userId = user.id;
      client.userRole = user.role;
      // client.rooms is already provided by Socket.io

      // Добавляем клиента в его личную комнату
      client.join(`user:${user.id}`);
      // Room management is handled by Socket.io

      // Добавляем в комнату роли
      client.join(`role:${user.role}`);
      // Room management is handled by Socket.io

      // Если есть команда, добавляем в комнату команды
      const teams = await this.prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true },
      });

      teams.forEach(team => {
        client.join(`team:${team.teamId}`);
        // Room management is handled by Socket.io
      });

      this.connectedClients.set(client.id, client);

      // Отправляем подтверждение подключения
      client.emit('connected', {
        userId: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      });

      // Уведомляем других о подключении пользователя
      client.broadcast.to(`role:${user.role}`).emit('userOnline', {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
      });

      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);
    } catch (error) {
      this.logger.error(`Connection error: ${(error as any).message || error}`);
      client.emit('error', { message: 'Ошибка авторизации' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Уведомляем других о отключении пользователя
      client.broadcast.to(`role:${client.userRole}`).emit('userOffline', {
        userId: client.userId,
      });
    }

    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel: string; entityId: string },
  ) {
    const room = `${data.channel}:${data.entityId}`;
    
    // Проверяем права доступа
    if (!this.canAccessChannel(client, data.channel, data.entityId)) {
      throw new WsException('Нет доступа к этому каналу');
    }

    client.join(room);
    // Room management is handled by Socket.io
    
    client.emit('subscribed', { room });
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel: string; entityId: string },
  ) {
    const room = `${data.channel}:${data.entityId}`;
    
    client.leave(room);
    client.rooms?.delete(room);
    
    client.emit('unsubscribed', { room });
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channel: string; entityId: string; isTyping: boolean },
  ) {
    const room = `${data.channel}:${data.entityId}`;
    
    client.broadcast.to(room).emit('userTyping', {
      userId: client.userId,
      isTyping: data.isTyping,
      channel: data.channel,
      entityId: data.entityId,
    });
  }

  @SubscribeMessage('presence')
  handlePresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'away' | 'busy' | 'offline' },
  ) {
    if (!client.userId) return;

    // Обновляем статус присутствия
    client.broadcast.to(`role:${client.userRole}`).emit('presenceUpdate', {
      userId: client.userId,
      status: data.status,
    });
  }

  // Методы для отправки уведомлений из других сервисов

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  sendToTeam(teamId: string, event: string, data: any) {
    this.server.to(`team:${teamId}`).emit(event, data);
  }

  sendToChannel(channel: string, entityId: string, event: string, data: any) {
    this.server.to(`${channel}:${entityId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Специфичные события для CRM

  notifyDealUpdate(dealId: string, data: any) {
    this.sendToChannel('deal', dealId, 'dealUpdated', data);
  }

  notifyContactUpdate(contactId: string, data: any) {
    this.sendToChannel('contact', contactId, 'contactUpdated', data);
  }

  notifyTaskAssigned(userId: string, task: any) {
    this.sendToUser(userId, 'taskAssigned', task);
  }

  notifyNewMessage(channelType: string, channelId: string, message: any) {
    this.sendToChannel(channelType, channelId, 'newMessage', message);
  }

  notifyNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification', notification);
  }

  private canAccessChannel(
    client: AuthenticatedSocket,
    channel: string,
    entityId: string,
  ): boolean {
    // Здесь должна быть логика проверки прав доступа
    // Для упрощения разрешаем все каналы авторизованным пользователям
    return !!client.userId;
  }

  // Получение списка онлайн пользователей
  getOnlineUsers(): string[] {
    const onlineUsers = new Set<string>();
    this.connectedClients.forEach(client => {
      if (client.userId) {
        onlineUsers.add(client.userId);
      }
    });
    return Array.from(onlineUsers);
  }

  // Получение количества подключенных клиентов
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}