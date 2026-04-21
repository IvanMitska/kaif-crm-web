import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketsService } from './websockets.service';
import { Server } from 'socket.io';

describe('WebsocketsService', () => {
  let service: WebsocketsService;
  let mockServer: Partial<Server>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsService],
    }).compile();

    service = module.get<WebsocketsService>(WebsocketsService);
    service.setServer(mockServer as Server);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setServer', () => {
    it('should set the server instance', () => {
      const newServer = { to: jest.fn(), emit: jest.fn() } as unknown as Server;
      service.setServer(newServer);

      // Verify by calling a method that uses the server
      service.broadcast('test', {});
      expect(newServer.emit).toHaveBeenCalled();
    });
  });

  describe('sendToUser', () => {
    it('should send event to specific user room', () => {
      const userId = 'user-123';
      const event = 'test:event';
      const data = { message: 'hello' };

      service.sendToUser(userId, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });

    it('should not throw if server is not set', () => {
      const newService = new WebsocketsService();
      expect(() => newService.sendToUser('user-123', 'test', {})).not.toThrow();
    });
  });

  describe('sendToRole', () => {
    it('should send event to role room', () => {
      const role = 'ADMIN';
      const event = 'admin:update';
      const data = { info: 'test' };

      service.sendToRole(role, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(`role:${role}`);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('sendToTeam', () => {
    it('should send event to team room', () => {
      const teamId = 'team-123';
      const event = 'team:notification';
      const data = { announcement: 'Meeting at 3pm' };

      service.sendToTeam(teamId, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(`team:${teamId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('sendToChannel', () => {
    it('should send event to channel room', () => {
      const channel = 'deal';
      const entityId = 'deal-123';
      const event = 'deal:updated';
      const data = { amount: 10000 };

      service.sendToChannel(channel, entityId, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(`${channel}:${entityId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('broadcast', () => {
    it('should broadcast event to all clients', () => {
      const event = 'system:announcement';
      const data = { message: 'System maintenance' };

      service.broadcast(event, data);

      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });
  });

  describe('notifyDealUpdate', () => {
    it('should notify about deal update with timestamp', () => {
      const dealId = 'deal-123';
      const data = { amount: 5000 };

      service.notifyDealUpdate(dealId, data);

      expect(mockServer.to).toHaveBeenCalledWith(`deal:${dealId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'deal:updated',
        expect.objectContaining({
          dealId,
          amount: 5000,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyDealStageChanged', () => {
    it('should notify about deal stage change', () => {
      const dealId = 'deal-123';
      const oldStage = 'New';
      const newStage = 'Negotiation';
      const userId = 'user-123';

      service.notifyDealStageChanged(dealId, oldStage, newStage, userId);

      expect(mockServer.to).toHaveBeenCalledWith(`deal:${dealId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'deal:stageChanged',
        expect.objectContaining({
          dealId,
          oldStage,
          newStage,
          changedBy: userId,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyContactUpdate', () => {
    it('should notify about contact update', () => {
      const contactId = 'contact-123';
      const data = { firstName: 'John' };

      service.notifyContactUpdate(contactId, data);

      expect(mockServer.to).toHaveBeenCalledWith(`contact:${contactId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'contact:updated',
        expect.objectContaining({
          contactId,
          firstName: 'John',
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyTaskAssigned', () => {
    it('should notify user about task assignment', () => {
      const userId = 'user-123';
      const task = { id: 'task-123', title: 'Call client' };

      service.notifyTaskAssigned(userId, task);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'task:assigned',
        expect.objectContaining({
          task,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyTaskCompleted', () => {
    it('should notify about task completion', () => {
      const taskId = 'task-123';
      const completedBy = 'user-123';

      service.notifyTaskCompleted(taskId, completedBy);

      expect(mockServer.to).toHaveBeenCalledWith(`task:${taskId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'task:completed',
        expect.objectContaining({
          taskId,
          completedBy,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyNewMessage', () => {
    it('should notify about new message', () => {
      const contactId = 'contact-123';
      const message = { content: 'Hello', channel: 'WHATSAPP' };

      service.notifyNewMessage(contactId, message);

      expect(mockServer.to).toHaveBeenCalledWith(`contact:${contactId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'message:new',
        expect.objectContaining({
          contactId,
          message,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyNewComment', () => {
    it('should notify about new comment', () => {
      const entityType = 'deal';
      const entityId = 'deal-123';
      const comment = { text: 'Great progress!' };

      service.notifyNewComment(entityType, entityId, comment);

      expect(mockServer.to).toHaveBeenCalledWith(`${entityType}:${entityId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'comment:new',
        expect.objectContaining({
          entityType,
          entityId,
          comment,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user', () => {
      const userId = 'user-123';
      const notification = { title: 'New lead', body: 'You have a new lead' };

      service.sendNotification(userId, notification);

      expect(mockServer.to).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining({
          notification,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyUserPresence', () => {
    it('should broadcast user presence update', () => {
      const userId = 'user-123';

      service.notifyUserPresence(userId, 'online');

      expect(mockServer.emit).toHaveBeenCalledWith(
        'presence:update',
        expect.objectContaining({
          userId,
          status: 'online',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle different status values', () => {
      service.notifyUserPresence('user-1', 'away');
      service.notifyUserPresence('user-2', 'busy');
      service.notifyUserPresence('user-3', 'offline');

      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('notifyTyping', () => {
    it('should notify about typing status', () => {
      const channel = 'contact';
      const entityId = 'contact-123';
      const userId = 'user-123';

      service.notifyTyping(channel, entityId, userId, true);

      expect(mockServer.to).toHaveBeenCalledWith(`${channel}:${entityId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'typing:status',
        expect.objectContaining({
          userId,
          isTyping: true,
          channel,
          entityId,
          timestamp: expect.any(String),
        }),
      );
    });

    it('should notify when user stops typing', () => {
      service.notifyTyping('deal', 'deal-123', 'user-123', false);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'typing:status',
        expect.objectContaining({
          isTyping: false,
        }),
      );
    });
  });

  describe('notifyDashboardUpdate', () => {
    it('should send update to admin and supervisor roles', () => {
      const data = { newLeads: 5, closedDeals: 3 };

      service.notifyDashboardUpdate(data);

      expect(mockServer.to).toHaveBeenCalledWith('role:ADMIN');
      expect(mockServer.to).toHaveBeenCalledWith('role:SUPERVISOR');
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyPipelineUpdate', () => {
    it('should notify about pipeline update', () => {
      const pipelineId = 'pipeline-123';
      const data = { stagesUpdated: true };

      service.notifyPipelineUpdate(pipelineId, data);

      expect(mockServer.to).toHaveBeenCalledWith(`pipeline:${pipelineId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'pipeline:updated',
        expect.objectContaining({
          pipelineId,
          stagesUpdated: true,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('notifyNewLead', () => {
    it('should notify managers and supervisors about new lead', () => {
      const lead = { id: 'lead-123', name: 'New Company' };

      service.notifyNewLead(lead);

      expect(mockServer.to).toHaveBeenCalledWith('role:MANAGER');
      expect(mockServer.to).toHaveBeenCalledWith('role:SUPERVISOR');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'lead:new',
        expect.objectContaining({
          lead,
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications', () => {
      const notifications = [
        { userId: 'user-1', data: { message: 'Hello 1' } },
        { userId: 'user-2', data: { message: 'Hello 2' } },
        { userId: 'user-3', data: { message: 'Hello 3' } },
      ];

      service.sendBulkNotifications(notifications);

      expect(mockServer.to).toHaveBeenCalledTimes(3);
      expect(mockServer.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', () => {
      service.sendBulkNotifications([]);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
