import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Company } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesFilterDto } from './dto/companies-filter.dto';
import * as XLSX from 'xlsx';

export interface CompanyImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: number;
}

interface CompanyRow {
  name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  industry?: string;
  size?: string;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string, organizationId: string) {
    const { tags, ...companyData } = createCompanyDto;

    // TODO: INN uniqueness check needs organizationId scope
    // For now, skip global uniqueness check
    // if (companyData.inn) {
    //   const existingCompany = await this.prisma.company.findFirst({
    //     where: { inn: companyData.inn, organizationId },
    //   });
    // }

    // TODO: Update tag handling for multi-tenant
    const company = await this.prisma.company.create({
      data: {
        ...companyData,
        ownerId: userId,
        createdById: userId,
        organizationId,
      },
      include: {
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
            contacts: true,
            deals: true,
          },
        },
      },
    });

    await this.createActivity(company.id, userId, 'company_created', {
      companyName: company.name,
    });

    return company;
  }

  async findAll(filter: CompaniesFilterDto, organizationId: string) {
    const {
      skip = 0,
      take = 20,
      search,
      industry,
      size,
      tagIds,
      ownerId,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.CompanyWhereInput = {
      organizationId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { inn: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { website: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(industry ? { industry } : {}),
      ...(size ? { size } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(tagIds && tagIds.length > 0 ? {
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      } : {}),
    };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
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
              contacts: true,
              deals: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, organizationId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
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
        contacts: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                deals: true,
                tasks: true,
              },
            },
          },
        },
        deals: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
          include: {
            stage: true,
            contact: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Компания не найдена');
    }

    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string, organizationId: string) {
    const company = await this.findOne(id, organizationId);

    const { tags, ...companyData } = updateCompanyDto;

    // TODO: INN uniqueness check needs organizationId scope
    // if (companyData.inn && companyData.inn !== company.inn) {
    //   const existingCompany = await this.prisma.company.findFirst({
    //     where: { inn: companyData.inn, organizationId, NOT: { id } },
    //   });
    // }

    // TODO: Update tag handling for multi-tenant
    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        ...companyData,
      },
      include: {
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
            contacts: true,
            deals: true,
          },
        },
      },
    });

    await this.createActivity(id, userId, 'company_updated', {
      changes: Object.keys(updateCompanyDto),
    });

    return updated;
  }

  async remove(id: string, organizationId: string) {
    const company = await this.findOne(id, organizationId);

    // Проверяем, есть ли связанные записи
    const [contactsCount, dealsCount] = await Promise.all([
      this.prisma.contact.count({ where: { companyId: id } }),
      this.prisma.deal.count({ where: { companyId: id } }),
    ]);

    if (contactsCount > 0 || dealsCount > 0) {
      throw new BadRequestException(
        `Невозможно удалить компанию. Связанные записи: ${contactsCount} контактов, ${dealsCount} сделок`
      );
    }

    await this.prisma.company.delete({
      where: { id },
    });

    return { message: 'Компания успешно удалена' };
  }

  async getCompanyStats(id: string, organizationId: string) {
    const company = await this.findOne(id, organizationId);

    const [
      contactsCount,
      activeDealsCount,
      totalDealsAmount,
      wonDealsCount,
      lostDealsCount,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { companyId: id } }),
      this.prisma.deal.count({ 
        where: { 
          companyId: id,
          status: { notIn: ['SUCCESS', 'LOST'] },
        } 
      }),
      this.prisma.deal.aggregate({
        where: { companyId: id },
        _sum: { amount: true },
      }),
      this.prisma.deal.count({ 
        where: { 
          companyId: id,
          status: 'SUCCESS',
        } 
      }),
      this.prisma.deal.count({ 
        where: { 
          companyId: id,
          status: 'LOST',
        } 
      }),
    ]);

    const lastActivity = await this.prisma.activity.findFirst({
      where: {
        OR: [
          { contact: { companyId: id } },
          { deal: { companyId: id } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      company,
      stats: {
        contactsCount,
        activeDealsCount,
        totalDealsAmount: totalDealsAmount._sum.amount || 0,
        wonDealsCount,
        lostDealsCount,
        conversionRate: (wonDealsCount + lostDealsCount) > 0
          ? Math.round((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100)
          : 0,
        lastActivityDate: lastActivity?.createdAt,
        daysSinceCreation: Math.floor(
          (Date.now() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
    };
  }

  async mergeCompanies(originalId: string, duplicateId: string, userId: string, organizationId: string) {
    // Role check is now handled by OrganizationGuard with @OrgRoles(OrgRole.ADMIN) decorator

    const [original, duplicate] = await Promise.all([
      this.findOne(originalId, organizationId),
      this.findOne(duplicateId, organizationId),
    ]);

    // Переносим все связанные записи на оригинальную компанию
    await Promise.all([
      this.prisma.contact.updateMany({
        where: { companyId: duplicateId },
        data: { companyId: originalId },
      }),
      this.prisma.deal.updateMany({
        where: { companyId: duplicateId },
        data: { companyId: originalId },
      }),
    ]);

    // Объединяем данные (приоритет у оригинала)
    const mergedData: Prisma.CompanyUpdateInput = {
      inn: original.inn || duplicate.inn,
      kpp: original.kpp || duplicate.kpp,
      ogrn: original.ogrn || duplicate.ogrn,
      website: original.website || duplicate.website,
      email: original.email || duplicate.email,
      phone: original.phone || duplicate.phone,
      address: original.address || duplicate.address,
      description: original.description 
        ? `${original.description}\n\n${duplicate.description || ''}`
        : duplicate.description,
      industry: original.industry || duplicate.industry,
      size: original.size || duplicate.size,
    };

    // Обновляем оригинальную компанию
    await this.prisma.company.update({
      where: { id: originalId },
      data: mergedData,
    });

    // Удаляем дубликат
    await this.prisma.company.delete({
      where: { id: duplicateId },
    });

    await this.createActivity(originalId, userId, 'companies_merged', {
      mergedCompanyId: duplicateId,
      mergedCompanyName: duplicate.name,
    });

    return { message: 'Компании успешно объединены' };
  }

  async changeOwner(id: string, newOwnerId: string, userId: string, organizationId: string) {
    // Role check is now handled by OrganizationGuard with @OrgRoles decorator

    const company = await this.findOne(id, organizationId);

    const newOwner = await this.prisma.user.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      throw new NotFoundException('Новый ответственный не найден');
    }

    const updated = await this.prisma.company.update({
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
      oldOwnerId: company.ownerId,
      newOwnerId,
      newOwnerName: `${newOwner.firstName} ${newOwner.lastName}`,
    });

    return updated;
  }

  async importCompanies(
    file: Express.Multer.File,
    userId: string,
    organizationId: string,
  ): Promise<CompanyImportResult> {
    const result: CompanyImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: 0,
    };

    try {
      // Parse file
      const rows = this.parseCompanyFile(file);

      if (rows.length === 0) {
        throw new BadRequestException('Файл пустой или имеет неверный формат');
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2; // Account for header row
        const row = rows[i];

        try {
          // Validate required fields
          if (!row.name) {
            result.errors.push({
              row: rowIndex,
              error: 'Название компании обязательно',
            });
            result.failed++;
            continue;
          }

          // Check for duplicates by INN (if provided)
          if (row.inn) {
            const existingByInn = await this.prisma.company.findFirst({
              where: {
                organizationId,
                inn: row.inn,
              },
            });

            if (existingByInn) {
              result.duplicates++;
              result.errors.push({
                row: rowIndex,
                error: `Дубликат: компания с ИНН ${row.inn} уже существует`,
              });
              result.failed++;
              continue;
            }
          }

          // Check for duplicates by name
          const existingByName = await this.prisma.company.findFirst({
            where: {
              organizationId,
              name: { equals: row.name.trim(), mode: 'insensitive' },
            },
          });

          if (existingByName) {
            result.duplicates++;
            result.errors.push({
              row: rowIndex,
              error: `Дубликат: компания "${row.name}" уже существует`,
            });
            result.failed++;
            continue;
          }

          // Create company
          await this.prisma.company.create({
            data: {
              name: row.name.trim(),
              inn: row.inn?.trim(),
              kpp: row.kpp?.trim(),
              ogrn: row.ogrn?.trim(),
              website: row.website?.trim(),
              email: row.email?.trim().toLowerCase(),
              phone: this.normalizePhone(row.phone),
              address: row.address?.trim(),
              description: row.description?.trim(),
              industry: row.industry?.trim(),
              size: row.size?.trim(),
              ownerId: userId,
              createdById: userId,
              organizationId,
            },
          });

          result.success++;
        } catch (error: any) {
          const errorMessage = error?.message || 'Неизвестная ошибка';
          this.logger.error(`Error importing company row ${rowIndex}: ${errorMessage}`);
          result.errors.push({
            row: rowIndex,
            error: errorMessage,
          });
          result.failed++;
        }
      }

      // Log import activity
      const contacts = await this.prisma.contact.findFirst({
        where: { organizationId },
        select: { id: true },
      });

      if (contacts) {
        await this.prisma.activity.create({
          data: {
            type: 'companies_imported',
            description: `Импортировано компаний: ${result.success}`,
            metadata: {
              totalRows: rows.length,
              success: result.success,
              failed: result.failed,
              duplicates: result.duplicates,
            },
            contactId: contacts.id,
            userId,
          },
        });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Неизвестная ошибка';
      this.logger.error(`Company import failed: ${errorMessage}`);
      throw new BadRequestException(`Ошибка импорта: ${errorMessage}`);
    }
  }

  async exportCompanies(
    filter: CompaniesFilterDto,
    organizationId: string,
    format: 'csv' | 'xlsx' = 'xlsx',
  ): Promise<Buffer> {
    // Fetch all companies matching filter (up to 50000 for export)
    const { data: companies } = await this.findAll(
      { ...filter, take: 50000, skip: 0 },
      organizationId,
    );

    // Prepare data for export
    const exportData = companies.map((company: any) => ({
      'Название': company.name,
      'ИНН': company.inn || '',
      'КПП': company.kpp || '',
      'ОГРН': company.ogrn || '',
      'Сайт': company.website || '',
      'Email': company.email || '',
      'Телефон': company.phone || '',
      'Адрес': company.address || '',
      'Отрасль': company.industry || '',
      'Размер': this.translateSize(company.size),
      'Описание': company.description || '',
      'Ответственный': company.owner
        ? `${company.owner.firstName} ${company.owner.lastName}`
        : '',
      'Контактов': company._count?.contacts || 0,
      'Сделок': company._count?.deals || 0,
      'Дата создания': new Date(company.createdAt).toLocaleDateString('ru-RU'),
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Компании');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Название
      { wch: 12 }, // ИНН
      { wch: 10 }, // КПП
      { wch: 15 }, // ОГРН
      { wch: 25 }, // Сайт
      { wch: 25 }, // Email
      { wch: 15 }, // Телефон
      { wch: 40 }, // Адрес
      { wch: 20 }, // Отрасль
      { wch: 15 }, // Размер
      { wch: 30 }, // Описание
      { wch: 20 }, // Ответственный
      { wch: 10 }, // Контактов
      { wch: 8 },  // Сделок
      { wch: 12 }, // Дата создания
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: format === 'csv' ? 'csv' : 'xlsx',
    });

    return buffer;
  }

  private parseCompanyFile(file: Express.Multer.File): CompanyRow[] {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    // Map columns to CompanyRow fields
    return jsonData.map((row) => ({
      name: row['Название'] || row['name'] || row['Name'] || row['Компания'] || row['Company'],
      inn: row['ИНН'] || row['inn'] || row['INN'],
      kpp: row['КПП'] || row['kpp'] || row['KPP'],
      ogrn: row['ОГРН'] || row['ogrn'] || row['OGRN'],
      website: row['Сайт'] || row['website'] || row['Website'] || row['URL'],
      email: row['Email'] || row['email'] || row['E-mail'],
      phone: row['Телефон'] || row['phone'] || row['Phone'],
      address: row['Адрес'] || row['address'] || row['Address'],
      description: row['Описание'] || row['description'] || row['Description'] || row['Notes'],
      industry: row['Отрасль'] || row['industry'] || row['Industry'],
      size: row['Размер'] || row['size'] || row['Size'],
    }));
  }

  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    const cleaned = phone.toString().replace(/[^\d+]/g, '');
    if (!cleaned) return undefined;
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

  private translateSize(size?: string): string {
    if (!size) return '';
    const translations: Record<string, string> = {
      'MICRO': 'Микро (до 15 чел.)',
      'SMALL': 'Малое (16-100 чел.)',
      'MEDIUM': 'Среднее (101-250 чел.)',
      'LARGE': 'Крупное (250+ чел.)',
    };
    return translations[size] || size;
  }

  private async createActivity(
    companyId: string,
    userId: string,
    type: string,
    metadata?: any
  ) {
    // Создаем активность для всех контактов компании
    const contacts = await this.prisma.contact.findMany({
      where: { companyId },
      select: { id: true },
    });

    await Promise.all(
      contacts.map(contact =>
        this.prisma.activity.create({
          data: {
            type,
            description: this.getActivityDescription(type),
            metadata,
            contactId: contact.id,
            userId,
          },
        })
      )
    );
  }

  private getActivityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      company_created: 'Компания создана',
      company_updated: 'Компания обновлена',
      owner_changed: 'Изменен ответственный',
      companies_merged: 'Компании объединены',
    };
    return descriptions[type] || type;
  }
}