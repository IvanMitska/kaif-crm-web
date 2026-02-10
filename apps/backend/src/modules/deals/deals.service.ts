import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Deal, DealStatus } from '@prisma/client';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsFilterDto } from './dto/deals-filter.dto';
import { MoveDealDto } from './dto/move-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(createDealDto: CreateDealDto, userId: string) {
    const { products, ...dealData } = createDealDto;

    // Получаем дефолтный pipeline и его первый этап
    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    if (!defaultPipeline || defaultPipeline.stages.length === 0) {
      throw new BadRequestException('Не настроена воронка продаж по умолчанию');
    }

    const deal = await this.prisma.deal.create({
      data: {
        ...dealData,
        stageId: createDealDto.stageId || defaultPipeline.stages[0].id,
        ownerId: userId,
        createdById: userId,
        products: products ? {
          create: products.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            price: p.price,
            discount: p.discount || 0,
          })),
        } : undefined,
      },
      include: {
        stage: {
          include: { pipeline: true },
        },
        contact: true,
        company: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        products: {
          include: { product: true },
        },
      },
    });

    await this.createActivity(deal.id, userId, 'deal_created', {
      dealTitle: deal.title,
      amount: deal.amount,
    });

    return deal;
  }

  async findAll(filter: DealsFilterDto, userId: string, userRole: string) {
    const {
      skip = 0,
      take = 20,
      search,
      status,
      stageId,
      pipelineId,
      contactId,
      companyId,
      ownerId,
      minAmount,
      maxAmount,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.DealWhereInput = {
      ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' ? { ownerId: userId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { contact: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }},
          { company: { name: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
      ...(status ? { status } : {}),
      ...(stageId ? { stageId } : {}),
      ...(pipelineId ? { stage: { pipelineId } } : {}),
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(minAmount ? { amount: { gte: minAmount } } : {}),
      ...(maxAmount ? { amount: { lte: maxAmount } } : {}),
    };

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          stage: {
            include: { pipeline: true },
          },
          contact: true,
          company: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              products: true,
              tasks: true,
            },
          },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: deals,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { 
        id,
        ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' ? { ownerId: userId } : {}),
      },
      include: {
        stage: {
          include: { 
            pipeline: {
              include: {
                stages: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        contact: true,
        company: true,
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
        products: {
          include: { product: true },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          where: {
            status: { not: 'COMPLETED' },
          },
          take: 5,
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
      },
    });

    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }

    return deal;
  }

  async update(id: string, updateDealDto: UpdateDealDto, userId: string, userRole: string) {
    const deal = await this.findOne(id, userId, userRole);

    const { products, ...dealData } = updateDealDto;

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        ...dealData,
        products: products ? {
          deleteMany: {},
          create: products.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            price: p.price,
            discount: p.discount || 0,
          })),
        } : undefined,
      },
      include: {
        stage: {
          include: { pipeline: true },
        },
        contact: true,
        company: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        products: {
          include: { product: true },
        },
      },
    });

    await this.createActivity(id, userId, 'deal_updated', {
      changes: Object.keys(updateDealDto),
    });

    return updated;
  }

  async moveDeal(id: string, moveDealDto: MoveDealDto, userId: string, userRole: string) {
    const deal = await this.findOne(id, userId, userRole);

    const newStage = await this.prisma.stage.findUnique({
      where: { id: moveDealDto.stageId },
      include: { 
        pipeline: {
          include: {
            stages: true
          }
        } 
      },
    });

    if (!newStage) {
      throw new NotFoundException('Этап не найден');
    }

    const oldStageId = deal.stageId;

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        stageId: moveDealDto.stageId,
        // Обновляем статус в зависимости от этапа
        status: this.getStatusByStageOrder(newStage.order, newStage.pipeline.stages.length),
      },
      include: {
        stage: {
          include: { pipeline: true },
        },
        contact: true,
        company: true,
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

    await this.createActivity(id, userId, 'deal_stage_changed', {
      oldStageId,
      newStageId: moveDealDto.stageId,
      oldStageName: deal.stage.name,
      newStageName: newStage.name,
    });

    // Запускаем автоматизации при смене этапа
    await this.triggerStageAutomations(id, oldStageId, moveDealDto.stageId);

    return updated;
  }

  async remove(id: string, userId: string, userRole: string) {
    await this.findOne(id, userId, userRole);

    await this.prisma.deal.delete({
      where: { id },
    });

    return { message: 'Сделка успешно удалена' };
  }

  async closeDeal(id: string, won: boolean, userId: string, userRole: string) {
    const deal = await this.findOne(id, userId, userRole);

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        status: won ? DealStatus.SUCCESS : DealStatus.LOST,
        closedAt: new Date(),
      },
      include: {
        stage: true,
        contact: true,
        company: true,
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

    await this.createActivity(id, userId, won ? 'deal_won' : 'deal_lost', {
      amount: deal.amount,
    });

    return updated;
  }

  async getDealsByStage(pipelineId: string, userId: string, userRole: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Воронка не найдена');
    }

    const stages = await Promise.all(
      pipeline.stages.map(async (stage) => {
        const deals = await this.prisma.deal.findMany({
          where: {
            stageId: stage.id,
            ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' ? { ownerId: userId } : {}),
          },
          include: {
            contact: true,
            company: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                tasks: {
                  where: { status: { not: 'COMPLETED' } },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });

        const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);

        return {
          ...stage,
          deals,
          dealsCount: deals.length,
          totalAmount,
        };
      }),
    );

    return {
      pipeline,
      stages,
    };
  }

  async duplicateDeal(id: string, userId: string, userRole: string) {
    const deal = await this.findOne(id, userId, userRole);

    const newDeal = await this.prisma.deal.create({
      data: {
        title: `${deal.title} (копия)`,
        amount: deal.amount,
        currency: deal.currency,
        probability: deal.probability,
        expectedDate: deal.expectedDate,
        description: deal.description,
        customFields: deal.customFields,
        stageId: deal.stageId,
        contactId: deal.contactId,
        companyId: deal.companyId,
        ownerId: userId,
        createdById: userId,
        status: DealStatus.NEW,
      },
      include: {
        stage: true,
        contact: true,
        company: true,
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

    // Копируем продукты
    if (deal.products.length > 0) {
      await this.prisma.dealProduct.createMany({
        data: deal.products.map(p => ({
          dealId: newDeal.id,
          productId: p.productId,
          quantity: p.quantity,
          price: p.price,
          discount: p.discount,
        })),
      });
    }

    await this.createActivity(newDeal.id, userId, 'deal_duplicated', {
      originalDealId: id,
      originalDealTitle: deal.title,
    });

    return newDeal;
  }

  async getDealStats(id: string, userId: string, userRole: string) {
    const deal = await this.findOne(id, userId, userRole);

    const [tasksCount, completedTasksCount, activitiesCount] = await Promise.all([
      this.prisma.task.count({ where: { dealId: id } }),
      this.prisma.task.count({ 
        where: { 
          dealId: id,
          status: 'COMPLETED',
        } 
      }),
      this.prisma.activity.count({ where: { dealId: id } }),
    ]);

    const timeline = await this.prisma.activity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const daysInPipeline = Math.floor(
      (Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      deal,
      stats: {
        tasksCount,
        completedTasksCount,
        taskCompletionRate: tasksCount > 0 
          ? Math.round((completedTasksCount / tasksCount) * 100) 
          : 0,
        activitiesCount,
        daysInPipeline,
        daysInCurrentStage: deal.updatedAt 
          ? Math.floor((Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      },
      timeline,
    };
  }

  private getStatusByStageOrder(order: number, totalStages: number): DealStatus {
    const percentage = (order / totalStages) * 100;
    
    if (percentage <= 20) return DealStatus.NEW;
    if (percentage <= 40) return DealStatus.QUALIFICATION;
    if (percentage <= 50) return DealStatus.PROPOSAL;
    if (percentage <= 70) return DealStatus.NEGOTIATION;
    if (percentage <= 85) return DealStatus.CONTRACT;
    if (percentage <= 95) return DealStatus.PAYMENT;
    
    return DealStatus.SUCCESS;
  }

  private async triggerStageAutomations(dealId: string, oldStageId: string, newStageId: string) {
    // Здесь будет логика запуска автоматизаций
    // Например, отправка уведомлений, создание задач и т.д.
    
    const automations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        trigger: {
          path: ['type'],
          equals: 'stage_changed',
        },
      },
    });

    for (const automation of automations) {
      // Проверяем условия и выполняем действия
      // Это заглушка для будущей реализации
    }
  }

  private async createActivity(
    dealId: string,
    userId: string,
    type: string,
    metadata?: any
  ) {
    await this.prisma.activity.create({
      data: {
        type,
        description: this.getActivityDescription(type),
        metadata,
        dealId,
        userId,
      },
    });
  }

  private getActivityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      deal_created: 'Сделка создана',
      deal_updated: 'Сделка обновлена',
      deal_stage_changed: 'Изменен этап сделки',
      deal_won: 'Сделка выиграна',
      deal_lost: 'Сделка проиграна',
      deal_duplicated: 'Сделка дублирована',
    };
    return descriptions[type] || type;
  }
}