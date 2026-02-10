import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Company } from '@prisma/client';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesFilterDto } from './dto/companies-filter.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    const { tags, ...companyData } = createCompanyDto;

    // Проверяем уникальность ИНН, если указан
    if (companyData.inn) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { inn: companyData.inn },
      });
      
      if (existingCompany) {
        throw new BadRequestException('Компания с таким ИНН уже существует');
      }
    }

    const company = await this.prisma.company.create({
      data: {
        ...companyData,
        ownerId: userId,
        createdById: userId,
        tags: tags ? {
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })),
        } : undefined,
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

  async findAll(filter: CompaniesFilterDto, userId: string, userRole: string) {
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
      ...(userRole !== 'ADMIN' ? { ownerId: userId } : {}),
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

  async findOne(id: string, userId: string, userRole: string) {
    const company = await this.prisma.company.findUnique({
      where: { 
        id,
        ...(userRole !== 'ADMIN' ? { ownerId: userId } : {}),
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

  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string, userRole: string) {
    const company = await this.findOne(id, userId, userRole);

    const { tags, ...companyData } = updateCompanyDto;

    // Проверяем уникальность ИНН при изменении
    if (companyData.inn && companyData.inn !== company.inn) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { inn: companyData.inn },
      });
      
      if (existingCompany) {
        throw new BadRequestException('Компания с таким ИНН уже существует');
      }
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        ...companyData,
        tags: tags ? {
          set: [],
          connectOrCreate: tags.map(tag => ({
            where: { name: tag },
            create: { name: tag },
          })),
        } : undefined,
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

  async remove(id: string, userId: string, userRole: string) {
    const company = await this.findOne(id, userId, userRole);

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

  async getCompanyStats(id: string, userId: string, userRole: string) {
    const company = await this.findOne(id, userId, userRole);

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

  async mergeCompanies(originalId: string, duplicateId: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN') {
      throw new BadRequestException('Только администратор может объединять компании');
    }

    const [original, duplicate] = await Promise.all([
      this.findOne(originalId, userId, userRole),
      this.findOne(duplicateId, userId, userRole),
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

  async changeOwner(id: string, newOwnerId: string, userId: string, userRole: string) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR') {
      throw new BadRequestException('Недостаточно прав для смены ответственного');
    }

    const company = await this.findOne(id, userId, userRole);

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

  async importCompanies(file: Express.Multer.File, userId: string) {
    // Здесь будет логика импорта из CSV/Excel
    // Пока заглушка
    return { message: 'Импорт компаний в разработке' };
  }

  async exportCompanies(filter: CompaniesFilterDto, userId: string, userRole: string) {
    const companies = await this.findAll(
      { ...filter, take: 10000 },
      userId,
      userRole
    );

    // Здесь будет логика экспорта в CSV/Excel
    // Пока заглушка
    return { message: 'Экспорт компаний в разработке', count: companies.total };
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