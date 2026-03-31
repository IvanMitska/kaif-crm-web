import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsFilterDto } from './dto/leads-filter.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto, userId: string, organizationId: string) {
    const lead = await this.prisma.lead.create({
      data: {
        ...createLeadDto,
        createdById: userId,
        ownerId: userId,
        organizationId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return lead;
  }

  async findAll(filter: LeadsFilterDto, organizationId: string) {
    const {
      skip = 0,
      take = 20,
      search,
      source,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: leads,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
    };
  }

  async findOne(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Лид не найден');
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, organizationId: string) {
    await this.findOne(id, organizationId);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.lead.delete({
      where: { id },
    });

    return { message: 'Лид успешно удален' };
  }

  async convert(id: string, data: any, userId: string, organizationId: string) {
    const lead = await this.findOne(id, organizationId);

    // Create a contact from the lead
    const contact = await this.prisma.contact.create({
      data: {
        firstName: lead.name.split(' ')[0] || lead.name,
        lastName: lead.name.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        phone: lead.phone,
        description: lead.description,
        source: lead.source as any,
        ownerId: userId,
        createdById: userId,
        organizationId,
        companyId: data?.companyId,
      },
    });

    // Update lead status to converted
    await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
      },
    });

    // Create a deal if requested
    let deal = null;
    if (data?.createDeal && data?.stageId) {
      deal = await this.prisma.deal.create({
        data: {
          title: data.dealTitle || `Сделка от лида: ${lead.name}`,
          amount: data.dealAmount || 0,
          stageId: data.stageId,
          contactId: contact.id,
          companyId: data.companyId,
          ownerId: userId,
          createdById: userId,
          organizationId,
        },
      });
    }

    return {
      message: 'Лид успешно конвертирован',
      contact,
      deal,
    };
  }

  async getStats(organizationId: string) {
    const where = { organizationId };

    const [total, byStatus, bySource] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
