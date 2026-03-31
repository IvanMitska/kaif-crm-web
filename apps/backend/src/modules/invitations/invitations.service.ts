import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserRole, InvitationStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvitationDto, invitedById: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    // Check for pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (existingInvitation) {
      throw new BadRequestException('Приглашение уже отправлено на этот email');
    }

    // Create invitation with 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role || UserRole.OPERATOR,
        invitedById,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Log invitation link (in production, send email)
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`;
    this.logger.log(`
========== INVITATION EMAIL ==========
To: ${invitation.email}
From: ${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}
Role: ${invitation.role}
Link: ${inviteUrl}
Expires: ${invitation.expiresAt}
=======================================
    `);

    return {
      ...invitation,
      inviteUrl, // Include for development/testing
    };
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: InvitationStatus;
  } = {}) {
    const { skip = 0, take = 50, status } = params;

    const where = status ? { status } : {};

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

    // Check if email is still available
    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });
    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    // Create user with hashed password
    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: invitation.role,
        isActive: true,
      },
    });

    // Update invitation
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedById: user.id,
        acceptedAt: new Date(),
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      message: 'Регистрация успешно завершена'
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
    });

    // Log invitation link again
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`;
    this.logger.log(`
========== RESENT INVITATION ==========
To: ${invitation.email}
Link: ${inviteUrl}
New Expires: ${expiresAt}
=======================================
    `);

    return { ...updated, inviteUrl };
  }
}
