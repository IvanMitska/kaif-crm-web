import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Contact, ContactSource } from '@prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsFilterDto } from './dto/contacts-filter.dto';
import { AutomationService, AutomationTriggerType } from '../automation/automation.service';
import * as XLSX from 'xlsx';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: number;
}

interface ContactRow {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  secondPhone?: string;
  position?: string;
  birthDate?: string;
  source?: string;
  description?: string;
  companyName?: string;
}

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AutomationService))
    private automationService: AutomationService,
  ) {}

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

    // Trigger automation for contact creation
    this.triggerContactCreatedAutomation(contact.id, userId, organizationId);

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

  async importContacts(
    file: Express.Multer.File,
    userId: string,
    organizationId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: 0,
    };

    try {
      // Parse file based on extension
      const rows = this.parseFile(file);

      if (rows.length === 0) {
        throw new BadRequestException('Файл пустой или имеет неверный формат');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2; // Account for header row (1-based index)
        const row = rows[i];

        try {
          // Validate required fields
          if (!row.firstName || !row.lastName) {
            result.errors.push({
              row: rowIndex,
              error: 'Имя и фамилия обязательны',
            });
            result.failed++;
            continue;
          }

          // Check for duplicates by email or phone
          if (row.email || row.phone) {
            const existingContact = await this.prisma.contact.findFirst({
              where: {
                organizationId,
                OR: [
                  ...(row.email ? [{ email: row.email }] : []),
                  ...(row.phone ? [{ phone: row.phone }] : []),
                ],
              },
            });

            if (existingContact) {
              result.duplicates++;
              result.errors.push({
                row: rowIndex,
                error: `Дубликат: контакт с таким ${row.email ? 'email' : 'телефоном'} уже существует`,
              });
              result.failed++;
              continue;
            }
          }

          // Find or create company if companyName provided
          let companyId: string | undefined;
          if (row.companyName) {
            const company = await this.prisma.company.findFirst({
              where: {
                organizationId,
                name: { equals: row.companyName, mode: 'insensitive' },
              },
            });

            if (company) {
              companyId = company.id;
            } else {
              // Create new company
              const newCompany = await this.prisma.company.create({
                data: {
                  name: row.companyName,
                  organization: { connect: { id: organizationId } },
                  owner: { connect: { id: userId } },
                  createdBy: { connect: { id: userId } },
                },
              });
              companyId = newCompany.id;
            }
          }

          // Parse source
          const source = this.parseContactSource(row.source);

          // Create contact
          await this.prisma.contact.create({
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              middleName: row.middleName?.trim(),
              email: row.email?.trim().toLowerCase(),
              phone: this.normalizePhone(row.phone),
              secondPhone: this.normalizePhone(row.secondPhone),
              position: row.position?.trim(),
              birthDate: row.birthDate ? new Date(row.birthDate) : undefined,
              source,
              description: row.description?.trim(),
              companyId,
              ownerId: userId,
              createdById: userId,
              organizationId,
            },
          });

          result.success++;
        } catch (error: any) {
          const errorMessage = error?.message || 'Неизвестная ошибка';
          this.logger.error(`Error importing row ${rowIndex}: ${errorMessage}`);
          result.errors.push({
            row: rowIndex,
            error: errorMessage,
          });
          result.failed++;
        }
      }

      // Log import activity
      await this.prisma.activity.create({
        data: {
          type: 'contacts_imported',
          description: `Импортировано контактов: ${result.success}`,
          metadata: {
            totalRows: rows.length,
            success: result.success,
            failed: result.failed,
            duplicates: result.duplicates,
          },
          userId,
        },
      });

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Неизвестная ошибка';
      this.logger.error(`Import failed: ${errorMessage}`);
      throw new BadRequestException(`Ошибка импорта: ${errorMessage}`);
    }
  }

  async exportContacts(
    filter: ContactsFilterDto,
    organizationId: string,
    format: 'csv' | 'xlsx' = 'xlsx',
  ): Promise<Buffer> {
    // Fetch all contacts matching filter (up to 50000 for export)
    const { data: contacts } = await this.findAll(
      { ...filter, take: 50000, skip: 0 },
      organizationId,
    );

    // Prepare data for export
    const exportData = contacts.map((contact: any) => ({
      'Имя': contact.firstName,
      'Фамилия': contact.lastName,
      'Отчество': contact.middleName || '',
      'Email': contact.email || '',
      'Телефон': contact.phone || '',
      'Доп. телефон': contact.secondPhone || '',
      'Должность': contact.position || '',
      'Дата рождения': contact.birthDate
        ? new Date(contact.birthDate).toLocaleDateString('ru-RU')
        : '',
      'Источник': this.translateSource(contact.source),
      'Компания': contact.company?.name || '',
      'Описание': contact.description || '',
      'Ответственный': contact.owner
        ? `${contact.owner.firstName} ${contact.owner.lastName}`
        : '',
      'Сделок': contact._count?.deals || 0,
      'Задач': contact._count?.tasks || 0,
      'Дата создания': new Date(contact.createdAt).toLocaleDateString('ru-RU'),
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Контакты');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Имя
      { wch: 15 }, // Фамилия
      { wch: 15 }, // Отчество
      { wch: 25 }, // Email
      { wch: 15 }, // Телефон
      { wch: 15 }, // Доп. телефон
      { wch: 20 }, // Должность
      { wch: 12 }, // Дата рождения
      { wch: 12 }, // Источник
      { wch: 25 }, // Компания
      { wch: 30 }, // Описание
      { wch: 20 }, // Ответственный
      { wch: 8 },  // Сделок
      { wch: 8 },  // Задач
      { wch: 12 }, // Дата создания
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: format === 'csv' ? 'csv' : 'xlsx',
    });

    return buffer;
  }

  private parseFile(file: Express.Multer.File): ContactRow[] {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    // Map columns to ContactRow fields
    return jsonData.map((row) => ({
      firstName: row['Имя'] || row['firstName'] || row['First Name'] || row['first_name'],
      lastName: row['Фамилия'] || row['lastName'] || row['Last Name'] || row['last_name'],
      middleName: row['Отчество'] || row['middleName'] || row['Middle Name'] || row['middle_name'],
      email: row['Email'] || row['email'] || row['E-mail'],
      phone: row['Телефон'] || row['phone'] || row['Phone'] || row['Мобильный'],
      secondPhone: row['Доп. телефон'] || row['secondPhone'] || row['Second Phone'] || row['Рабочий телефон'],
      position: row['Должность'] || row['position'] || row['Position'] || row['Job Title'],
      birthDate: row['Дата рождения'] || row['birthDate'] || row['Birth Date'] || row['birthday'],
      source: row['Источник'] || row['source'] || row['Source'],
      description: row['Описание'] || row['description'] || row['Description'] || row['Notes'],
      companyName: row['Компания'] || row['companyName'] || row['Company'] || row['company'],
    }));
  }

  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    // Remove all non-digit characters except +
    const cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (!cleaned) return undefined;
    // Add + prefix if starts with 7 or 8
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      return '+7' + cleaned.slice(1);
    }
    if (cleaned.startsWith('7') && cleaned.length === 11) {
      return '+' + cleaned;
    }
    if (!cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    return cleaned;
  }

  private parseContactSource(source?: string): ContactSource {
    if (!source) return ContactSource.DIRECT;

    const sourceMap: Record<string, ContactSource> = {
      'website': ContactSource.WEBSITE,
      'сайт': ContactSource.WEBSITE,
      'referral': ContactSource.REFERRAL,
      'рекомендация': ContactSource.REFERRAL,
      'whatsapp': ContactSource.WHATSAPP,
      'вотсап': ContactSource.WHATSAPP,
      'ватсап': ContactSource.WHATSAPP,
      'instagram': ContactSource.INSTAGRAM,
      'инстаграм': ContactSource.INSTAGRAM,
      'telegram': ContactSource.TELEGRAM,
      'телеграм': ContactSource.TELEGRAM,
      'vk': ContactSource.VK,
      'вконтакте': ContactSource.VK,
      'вк': ContactSource.VK,
      'email': ContactSource.EMAIL,
      'phone': ContactSource.PHONE,
      'телефон': ContactSource.PHONE,
      'other': ContactSource.OTHER,
      'другое': ContactSource.OTHER,
      'direct': ContactSource.DIRECT,
      'напрямую': ContactSource.DIRECT,
    };

    return sourceMap[source.toLowerCase()] || ContactSource.OTHER;
  }

  private translateSource(source: ContactSource): string {
    const translations: Record<ContactSource, string> = {
      [ContactSource.WEBSITE]: 'Сайт',
      [ContactSource.REFERRAL]: 'Рекомендация',
      [ContactSource.WHATSAPP]: 'WhatsApp',
      [ContactSource.INSTAGRAM]: 'Instagram',
      [ContactSource.TELEGRAM]: 'Telegram',
      [ContactSource.VK]: 'ВКонтакте',
      [ContactSource.EMAIL]: 'Email',
      [ContactSource.PHONE]: 'Телефон',
      [ContactSource.OTHER]: 'Другое',
      [ContactSource.DIRECT]: 'Напрямую',
    };
    return translations[source] || source;
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

  private async triggerContactCreatedAutomation(
    contactId: string,
    userId: string,
    organizationId: string,
  ) {
    try {
      const results = await this.automationService.executeByTrigger(
        AutomationTriggerType.CONTACT_CREATED,
        {
          contactId,
          userId,
          organizationId,
        },
      );

      if (results.length > 0) {
        const successCount = results.filter((r) => r.success).length;
        this.logger.log(`Contact created automations: ${successCount}/${results.length} successful`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to trigger contact created automations: ${error?.message}`);
    }
  }
}
