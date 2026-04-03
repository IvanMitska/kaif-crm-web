import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { OrgRole, InvitationStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async create(dto: CreateInvitationDto, invitedById: string, organizationId: string) {
    // Check if user is already a member of this organization
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      // Check if already a member of this organization
      const existingMember = await this.prisma.orgMember.findFirst({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });
      if (existingMember) {
        throw new BadRequestException('Пользователь уже является участником организации');
      }
    }

    // Check for pending invitation to this organization - resend if exists
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        organizationId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
    });

    if (existingInvitation) {
      // Update expiration and resend
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.invitation.update({
        where: { id: existingInvitation.id },
        data: { expiresAt },
      });

      const inviteUrl = `${this.frontendUrl}/invite/${existingInvitation.token}`;

      await this.emailService.sendInvitationEmail({
        to: existingInvitation.email,
        inviterName: `${existingInvitation.invitedBy.firstName} ${existingInvitation.invitedBy.lastName}`,
        organizationName: existingInvitation.organization?.name || 'Sintara CRM',
        role: existingInvitation.role,
        inviteUrl,
        expiresAt,
      });

      return {
        ...existingInvitation,
        expiresAt,
        inviteUrl,
        resent: true,
      };
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role || OrgRole.OPERATOR,
        organizationId,
        invitedById,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
    });

    // Send invitation email
    const inviteUrl = `${this.frontendUrl}/invite/${invitation.token}`;

    await this.emailService.sendInvitationEmail({
      to: invitation.email,
      inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      organizationName: invitation.organization?.name || 'Sintara CRM',
      role: invitation.role,
      inviteUrl,
      expiresAt: invitation.expiresAt,
    });

    return {
      ...invitation,
      inviteUrl,
    };
  }

  async findAll(
    organizationId: string,
    params: {
      skip?: number;
      take?: number;
      status?: InvitationStatus;
    } = {},
  ) {
    const { skip = 0, take = 50, status } = params;

    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          invitedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          acceptedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.invitation.count({ where }),
    ]);

    return { data: invitations, total, skip, take };
  }

  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение недействительно');
    }

    if (invitation.expiresAt < new Date()) {
      // Auto-expire
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Приглашение истекло');
    }

    return invitation;
  }

  async accept(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение недействительно');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Приглашение истекло');
    }

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // Check if already a member of this organization
    if (user && invitation.organizationId) {
      const existingMember = await this.prisma.orgMember.findFirst({
        where: {
          userId: user.id,
          organizationId: invitation.organizationId,
        },
      });
      if (existingMember) {
        throw new BadRequestException('Вы уже являетесь участником этой организации');
      }
    }

    // Transaction to create user (if needed) and membership
    const result = await this.prisma.$transaction(async (tx) => {
      if (!user) {
        // Create new user
        const hashedPassword = await argon2.hash(dto.password);
        user = await tx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            isActive: true,
          },
        });
      }

      // Create organization membership
      if (invitation.organizationId) {
        await tx.orgMember.create({
          data: {
            userId: user.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
          },
        });
      }

      // Update invitation
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedById: user.id,
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = result;
    return {
      user: userWithoutPassword,
      organization: invitation.organization,
      message: 'Регистрация успешно завершена',
    };
  }

  async cancel(id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Можно отменить только ожидающие приглашения');
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.CANCELLED },
    });
  }

  async resend(id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Приглашение не найдено');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Можно переотправить только ожидающие приглашения');
    }

    // Extend expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: { expiresAt },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });

    // Resend invitation email
    const inviteUrl = `${this.frontendUrl}/invite/${invitation.token}`;

    await this.emailService.sendInvitationEmail({
      to: invitation.email,
      inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      organizationName: updated.organization?.name || 'Sintara CRM',
      role: invitation.role,
      inviteUrl,
      expiresAt,
    });

    return { ...updated, inviteUrl };
  }
}
