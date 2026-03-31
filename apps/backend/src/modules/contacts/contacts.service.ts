import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Contact, ContactSource } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsFilterDto } from './dto/contacts-filter.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto, userId: string, organizationId: string) {
    const { tags, ...contactData } = createContactDto;

    const contact = await this.prisma.contact.create({
      data: {
        ...contactData,
        ownerId: userId,
        createdById: userId,
        organizationId,
      },
      include: {
        company: true,
        tags: true,
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

    await this.createActivity(contact.id, userId, 'contact_created', {
      contactName: `${contact.firstName} ${contact.lastName}`,
    });

    return contact;
  }

  async findAll(filter: ContactsFilterDto, organizationId: string) {
    const {
      skip = 0,
      take = 20,
      search,
      source,
      companyId,
      tagIds,
      ownerId,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.ContactWhereInput = {
      organizationId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
      ...(source ? { source } : {}),
      ...(companyId ? { companyId } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(tagIds && tagIds.length > 0 ? {
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      } : {}),
    };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          company: true,
          tags: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              deals: true,
              tasks: true,
              messages: true,
            },
          },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        company: true,
        tags: true,
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
        deals: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: {
            stage: true,
          },
        },
        tasks: {
          take: 5,
          orderBy: { dueDate: 'asc' },
          where: {
            status: { not: 'COMPLETED' },
          },
        },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const { tags, ...contactData } = updateContactDto;

    const updated = await this.prisma.contact.update({
      where: { id },
      data: contactData,
      include: {
        company: true,
        tags: true,
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

    await this.createActivity(id, userId, 'contact_updated', {
      changes: Object.keys(updateContactDto),
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.contact.delete({
      where: { id },
    });

    return { message: 'Контакт успешно удален' };
  }

  async importContacts(file: Express.Multer.File, userId: string, organizationId: string) {
    // Здесь будет логика импорта из CSV/Excel
    return { message: 'Импорт контактов в разработке' };
  }

  async exportContacts(filter: ContactsFilterDto, organizationId: string) {
    const contacts = await this.findAll({ ...filter, take: 10000 }, organizationId);
    return { message: 'Экспорт контактов в разработке', count: contacts.total };
  }

  async findDuplicates(organizationId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    const duplicates: any[] = [];
    const seen = new Map();

    for (const contact of contacts) {
      const key = `${contact.email?.toLowerCase() || ''}_${contact.phone || ''}`;

      if (key !== '_' && seen.has(key)) {
        const existing = seen.get(key);
        duplicates.push({
          original: existing,
          duplicate: contact,
          matchedBy: contact.email ? 'email' : 'phone',
        });
      } else {
        seen.set(key, contact);
      }
    }

    return duplicates;
  }

  async mergeDuplicates(originalId: string, duplicateId: string, userId: string, organizationId: string) {
    const [original, duplicate] = await Promise.all([
      this.findOne(originalId, organizationId),
      this.findOne(duplicateId, organizationId),
    ]);

    // Переносим все связанные записи на оригинальный контакт
    await Promise.all([
      this.prisma.deal.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: originalId },
      }),
      this.prisma.task.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: originalId },
      }),
      this.prisma.activity.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: originalId },
      }),
      this.prisma.message.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: originalId },
      }),
    ]);

    // Объединяем данные (приоритет у оригинала)
    const mergedData: Prisma.ContactUpdateInput = {
      email: original.email || duplicate.email,
      phone: original.phone || duplicate.phone,
      secondPhone: original.secondPhone || duplicate.secondPhone,
      position: original.position || duplicate.position,
      birthDate: original.birthDate || duplicate.birthDate,
      description: original.description
        ? `${original.description}\n\n${duplicate.description || ''}`
        : duplicate.description,
    };

    await this.prisma.contact.update({
      where: { id: originalId },
      data: mergedData,
    });

    await this.prisma.contact.delete({
      where: { id: duplicateId },
    });

    await this.createActivity(originalId, userId, 'contacts_merged', {
      mergedContactId: duplicateId,
      mergedContactName: `${duplicate.firstName} ${duplicate.lastName}`,
    });

    return { message: 'Контакты успешно объединены' };
  }

  async changeOwner(id: string, newOwnerId: string, userId: string, organizationId: string) {
    const contact = await this.findOne(id, organizationId);

    const newOwner = await this.prisma.user.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      throw new NotFoundException('Новый ответственный не найден');
    }

    const updated = await this.prisma.contact.update({
      where: { id },
      data: { ownerId: newOwnerId },
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

    await this.createActivity(id, userId, 'owner_changed', {
      oldOwnerId: contact.ownerId,
      newOwnerId,
      newOwnerName: `${newOwner.firstName} ${newOwner.lastName}`,
    });

    return updated;
  }

  async getContactStats(id: string, organizationId: string) {
    const contact = await this.findOne(id, organizationId);

    const [dealsCount, tasksCount, messagesCount, totalDealsAmount] = await Promise.all([
      this.prisma.deal.count({ where: { contactId: id } }),
      this.prisma.task.count({ where: { contactId: id } }),
      this.prisma.message.count({ where: { contactId: id } }),
      this.prisma.deal.aggregate({
        where: { contactId: id },
        _sum: { amount: true },
      }),
    ]);

    const lastActivity = await this.prisma.activity.findFirst({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      contact,
      stats: {
        dealsCount,
        tasksCount,
        messagesCount,
        totalDealsAmount: totalDealsAmount._sum.amount || 0,
        lastActivityDate: lastActivity?.createdAt,
        daysSinceCreation: Math.floor(
          (Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    };
  }

  private async createActivity(
    contactId: string,
    userId: string,
    type: string,
    metadata?: any
  ) {
    await this.prisma.activity.create({
      data: {
        type,
        description: this.getActivityDescription(type),
        metadata,
        contactId,
        userId,
      },
    });
  }

  private getActivityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      contact_created: 'Контакт создан',
      contact_updated: 'Контакт обновлен',
      owner_changed: 'Изменен ответственный',
      contacts_merged: 'Контакты объединены',
    };
    return descriptions[type] || type;
  }
}
