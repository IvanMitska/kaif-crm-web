import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, ownerId: string) {
    // Generate slug from name if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug is unique
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new BadRequestException('Организация с таким URL уже существует');
    }

    // Create organization and owner membership in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.name,
          slug,
        },
      });

      await tx.orgMember.create({
        data: {
          userId: ownerId,
          organizationId: organization.id,
          role: OrgRole.OWNER,
        },
      });

      return organization;
    });

    return result;
  }

  async findById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Организация не найдена');
    }

    return organization;
  }

  async findBySlug(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Организация не найдена');
    }

    return organization;
  }

  async update(organizationId: string, dto: UpdateOrganizationDto) {
    // Check slug uniqueness if changing
    if (dto.slug) {
      const existingOrg = await this.prisma.organization.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id: organizationId },
        },
      });

      if (existingOrg) {
        throw new BadRequestException('Организация с таким URL уже существует');
      }
    }

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    });
  }

  async delete(organizationId: string) {
    return this.prisma.organization.delete({
      where: { id: organizationId },
    });
  }

  // Member management
  async getMembers(organizationId: string) {
    return this.prisma.orgMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            lastActivityAt: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getMember(organizationId: string, memberId: string) {
    const member = await this.prisma.orgMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            lastActivityAt: true,
            isActive: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден');
    }

    return member;
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requesterId: string,
  ) {
    const member = await this.prisma.orgMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден');
    }

    // Can't change owner role
    if (member.role === OrgRole.OWNER) {
      throw new ForbiddenException('Нельзя изменить роль владельца');
    }

    // Can't promote to owner
    if (dto.role === OrgRole.OWNER) {
      throw new ForbiddenException('Нельзя назначить роль владельца');
    }

    return this.prisma.orgMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    requesterId: string,
  ) {
    const member = await this.prisma.orgMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден');
    }

    // Can't remove owner
    if (member.role === OrgRole.OWNER) {
      throw new ForbiddenException('Нельзя удалить владельца организации');
    }

    return this.prisma.orgMember.delete({
      where: { id: memberId },
    });
  }

  async toggleMemberActive(organizationId: string, memberId: string) {
    const member = await this.prisma.orgMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
    });

    if (!member) {
      throw new NotFoundException('Участник не найден');
    }

    if (member.role === OrgRole.OWNER) {
      throw new ForbiddenException('Нельзя деактивировать владельца');
    }

    return this.prisma.orgMember.update({
      where: { id: memberId },
      data: { isActive: !member.isActive },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Helper methods
  async getUserOrganizations(userId: string) {
    return this.prisma.orgMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
  }

  async getUserMembership(userId: string, organizationId: string) {
    return this.prisma.orgMember.findFirst({
      where: {
        userId,
        organizationId,
      },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
      + '-' + Date.now().toString(36);
  }
}
