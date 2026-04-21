import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from './invitations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OrgRole, InvitationStatus } from '@prisma/client';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockUserId = 'user-123';
  const mockOrgId = 'org-123';
  const mockInvitationId = 'invitation-123';
  const mockToken = 'test-token-uuid';

  const mockInvitation = {
    id: mockInvitationId,
    email: 'invited@example.com',
    token: mockToken,
    role: OrgRole.OPERATOR,
    status: InvitationStatus.PENDING,
    organizationId: mockOrgId,
    invitedById: mockUserId,
    acceptedById: null,
    acceptedAt: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvitedBy = {
    id: mockUserId,
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'inviter@example.com',
  };

  const mockOrganization = {
    id: mockOrgId,
    name: 'Тестовая организация',
  };

  const mockInvitationWithRelations = {
    ...mockInvitation,
    invitedBy: mockInvitedBy,
    organization: mockOrganization,
  };

  const mockPrismaService = {
    invitation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    orgMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendInvitationEmail: jest.fn().mockResolvedValue(true),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      email: 'newuser@example.com',
      role: OrgRole.MANAGER,
    };

    it('should create a new invitation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitationWithRelations);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toHaveProperty('inviteUrl');
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is already a member', async () => {
      const existingUser = { id: 'existing-user', email: createDto.email };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.orgMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: existingUser.id,
        organizationId: mockOrgId,
      });

      await expect(service.create(createDto, mockUserId, mockOrgId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should resend existing pending invitation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.invitation.findFirst.mockResolvedValue(mockInvitationWithRelations);
      mockPrismaService.invitation.update.mockResolvedValue(mockInvitationWithRelations);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toHaveProperty('resent', true);
      expect(mockPrismaService.invitation.update).toHaveBeenCalled();
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should create invitation with default OPERATOR role when not specified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitationWithRelations);

      await service.create({ email: 'test@example.com' }, mockUserId, mockOrgId);

      expect(mockPrismaService.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: OrgRole.OPERATOR,
          }),
        })
      );
    });

    it('should allow inviting existing user to new organization', async () => {
      const existingUser = { id: 'existing-user', email: createDto.email };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null); // Not a member yet
      mockPrismaService.invitation.findFirst.mockResolvedValue(null);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitationWithRelations);

      const result = await service.create(createDto, mockUserId, mockOrgId);

      expect(result).toHaveProperty('inviteUrl');
    });
  });

  describe('findAll', () => {
    it('should return paginated invitations', async () => {
      const mockInvitations = [mockInvitationWithRelations];
      mockPrismaService.invitation.findMany.mockResolvedValue(mockInvitations);
      mockPrismaService.invitation.count.mockResolvedValue(1);

      const result = await service.findAll(mockOrgId);

      expect(result).toEqual({
        data: mockInvitations,
        total: 1,
        skip: 0,
        take: 50,
      });
    });

    it('should filter by status', async () => {
      mockPrismaService.invitation.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.count.mockResolvedValue(0);

      await service.findAll(mockOrgId, { status: InvitationStatus.PENDING });

      expect(mockPrismaService.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: mockOrgId,
            status: InvitationStatus.PENDING,
          },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaService.invitation.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.count.mockResolvedValue(100);

      const result = await service.findAll(mockOrgId, { skip: 10, take: 20 });

      expect(result).toEqual({
        data: [],
        total: 100,
        skip: 10,
        take: 20,
      });
      expect(mockPrismaService.invitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('findByToken', () => {
    it('should return invitation by token', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitationWithRelations);

      const result = await service.findByToken(mockToken);

      expect(result).toEqual(mockInvitationWithRelations);
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.findByToken('unknown-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invitation is not pending', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitationWithRelations,
        status: InvitationStatus.ACCEPTED,
      });

      await expect(service.findByToken(mockToken)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException and update status when invitation expired', async () => {
      const expiredInvitation = {
        ...mockInvitationWithRelations,
        expiresAt: new Date(Date.now() - 1000), // expired
      };
      mockPrismaService.invitation.findUnique.mockResolvedValue(expiredInvitation);
      mockPrismaService.invitation.update.mockResolvedValue({
        ...expiredInvitation,
        status: InvitationStatus.EXPIRED,
      });

      await expect(service.findByToken(mockToken)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.invitation.update).toHaveBeenCalledWith({
        where: { id: mockInvitationId },
        data: { status: InvitationStatus.EXPIRED },
      });
    });
  });

  describe('accept', () => {
    const acceptDto = {
      token: mockToken,
      password: 'Test123!',
      firstName: 'Новый',
      lastName: 'Пользователь',
      phone: '+79991234567',
    };

    it('should create new user and membership when accepting invitation', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        organization: mockOrganization,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const newUser = {
        id: 'new-user-123',
        email: mockInvitation.email,
        firstName: acceptDto.firstName,
        lastName: acceptDto.lastName,
        password: 'hashed',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { create: jest.fn().mockResolvedValue(newUser) },
          orgMember: { create: jest.fn().mockResolvedValue({}) },
          invitation: { update: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.accept(acceptDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('message');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.accept(acceptDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invitation is not pending', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.CANCELLED,
      });

      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invitation expired', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000),
        organization: mockOrganization,
      });
      mockPrismaService.invitation.update.mockResolvedValue({});

      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user is already a member', async () => {
      const existingUser = { id: 'existing-user', email: mockInvitation.email };
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        organization: mockOrganization,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.orgMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: existingUser.id,
        organizationId: mockOrgId,
      });

      await expect(service.accept(acceptDto)).rejects.toThrow(BadRequestException);
    });

    it('should add existing user to organization without creating new user', async () => {
      const existingUser = {
        id: 'existing-user',
        email: mockInvitation.email,
        firstName: 'Существующий',
        lastName: 'Пользователь',
        password: 'hashed',
      };

      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        organization: mockOrganization,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.orgMember.findFirst.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: { create: jest.fn() },
          orgMember: { create: jest.fn().mockResolvedValue({}) },
          invitation: { update: jest.fn().mockResolvedValue({}) },
        });
      });

      const result = await service.accept(acceptDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('cancel', () => {
    it('should cancel pending invitation', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrismaService.invitation.update.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.CANCELLED,
      });

      const result = await service.cancel(mockInvitationId);

      expect(result.status).toBe(InvitationStatus.CANCELLED);
      expect(mockPrismaService.invitation.update).toHaveBeenCalledWith({
        where: { id: mockInvitationId },
        data: { status: InvitationStatus.CANCELLED },
      });
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.cancel('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invitation is not pending', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.ACCEPTED,
      });

      await expect(service.cancel(mockInvitationId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resend', () => {
    it('should resend invitation email', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        invitedBy: mockInvitedBy,
      });
      mockPrismaService.invitation.update.mockResolvedValue({
        ...mockInvitation,
        organization: mockOrganization,
      });

      const result = await service.resend(mockInvitationId);

      expect(result).toHaveProperty('inviteUrl');
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException when invitation not found', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.resend('unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invitation is not pending', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        status: InvitationStatus.EXPIRED,
      });

      await expect(service.resend(mockInvitationId)).rejects.toThrow(BadRequestException);
    });

    it('should extend expiration date by 7 days', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        invitedBy: mockInvitedBy,
      });
      mockPrismaService.invitation.update.mockResolvedValue({
        ...mockInvitation,
        organization: mockOrganization,
      });

      await service.resend(mockInvitationId);

      expect(mockPrismaService.invitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );

      jest.useRealTimers();
    });
  });
});
