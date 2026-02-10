import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalContacts,
      totalDeals,
      totalTasks,
      totalCompanies,
      activeDeals,
      activeDealsData,
      pendingTasks,
      todayTasks,
      highPriorityTasks,
      recentContacts,
      recentActivities,
      funnel,
    ] = await Promise.all([
      this.prisma.contact.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.deal.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.task.count(userId ? { where: { assigneeId: userId } } : undefined),
      this.prisma.company.count(userId ? { where: { ownerId: userId } } : undefined),
      this.prisma.deal.count({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          closedAt: null,
        },
      }),
      this.prisma.deal.findMany({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          closedAt: null,
        },
        select: { amount: true },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: 'PENDING',
        },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.task.count({
        where: {
          ...(userId ? { assigneeId: userId } : {}),
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          priority: { in: ['HIGH', 'URGENT'] },
        },
      }),
      this.prisma.contact.count({
        where: {
          ...(userId ? { ownerId: userId } : {}),
          createdAt: { gte: weekAgo },
        },
      }),
      this.prisma.activity.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.getConversionFunnel(),
    ]);

    const totalDealsAmount = activeDealsData.reduce((sum, deal) => sum + Number(deal.amount), 0);

    // Calculate deals added today
    const dealsAddedToday = await this.prisma.deal.count({
      where: {
        ...(userId ? { ownerId: userId } : {}),
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      totalContacts,
      totalDeals,
      totalTasks,
      totalCompanies,
      activeDeals,
      totalDealsAmount,
      pendingTasks,
      todayTasks,
      highPriorityTasks,
      recentContacts,
      dealsAddedToday,
      recentActivities,
      funnel,
    };
  }

  async getTodayTasks(userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.task.findMany({
      where: {
        ...(userId ? { assigneeId: userId } : {}),
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        deal: { select: { title: true } },
      },
    });
  }

  async getSalesAnalytics(startDate: Date, endDate: Date) {
    const deals = await this.prisma.deal.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        stage: true,
      },
    });

    const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount), 0);
    const averageAmount = deals.length > 0 ? totalAmount / deals.length : 0;
    const dealsByStage = deals.reduce((acc, deal) => {
      const stageName = deal.stage.name;
      acc[stageName] = (acc[stageName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDeals: deals.length,
      totalAmount,
      averageAmount,
      dealsByStage,
    };
  }

  async getActivityAnalytics(userId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await this.prisma.activity.findMany({
      where: {
        ...(userId ? { userId } : {}),
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const activitiesByType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activitiesByDay = activities.reduce((acc, activity) => {
      const day = activity.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activities.length,
      byType: activitiesByType,
      byDay: activitiesByDay,
    };
  }

  async getConversionFunnel() {
    const stages = await this.prisma.stage.findMany({
      include: {
        deals: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      dealsCount: stage.deals.length,
      totalAmount: stage.deals.reduce((sum, deal) => sum + Number(deal.amount), 0),
    }));
  }
}