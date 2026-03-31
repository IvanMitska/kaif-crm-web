import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createActivityDto: CreateActivityDto, userId: string, organizationId: string) {
    return this.prisma.activity.create({
      data: {
        ...createActivityDto,
        userId,
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        contact: true,
        deal: true,
      },
    });
  }

  async findAll(filters: any = {}, organizationId: string) {
    const { contactId, dealId, type, skip = 0, take = 50 } = filters;

    return this.prisma.activity.findMany({
      where: {
        organizationId,
        ...(contactId ? { contactId } : {}),
        ...(dealId ? { dealId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        contact: true,
        deal: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findOne(id: string, organizationId: string) {
    return this.prisma.activity.findFirst({
      where: { id, organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        contact: true,
        deal: true,
      },
    });
  }

  async update(id: string, updateActivityDto: UpdateActivityDto, organizationId: string) {
    return this.prisma.activity.update({
      where: { id },
      data: updateActivityDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        contact: true,
        deal: true,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    return this.prisma.activity.delete({
      where: { id },
    });
  }
}
