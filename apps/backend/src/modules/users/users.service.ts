import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          teams: {
            include: {
              team: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      skip: skip || 0,
      take: take || users.length,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        teams: {
          include: {
            team: true,
          },
        },
        ownedContacts: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        ownedDeals: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    if (data.password) {
      data.password = await argon2.hash(data.password);
    }

    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await this.findOne(id);

    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email as string);
      if (existingUser) {
        throw new BadRequestException('Пользователь с таким email уже существует');
      }
    }

    if (data.password) {
      data.password = await argon2.hash(data.password as string);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async updateRole(id: string, role: UserRole) {
    await this.findOne(id);
    
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Пользователь успешно удален' };
  }

  async getUserStats(id: string) {
    const user = await this.findOne(id);

    const [contactsCount, dealsCount, tasksCount, completedTasksCount] = await Promise.all([
      this.prisma.contact.count({ where: { ownerId: id } }),
      this.prisma.deal.count({ where: { ownerId: id } }),
      this.prisma.task.count({ where: { assigneeId: id } }),
      this.prisma.task.count({ 
        where: { 
          assigneeId: id,
          status: 'COMPLETED',
        } 
      }),
    ]);

    const activeDeals = await this.prisma.deal.findMany({
      where: {
        ownerId: id,
        status: {
          notIn: ['SUCCESS', 'LOST'],
        },
      },
      select: {
        amount: true,
      },
    });

    const totalActiveDealsAmount = activeDeals.reduce(
      (sum, deal) => sum + Number(deal.amount),
      0,
    );

    return {
      user,
      stats: {
        contactsCount,
        dealsCount,
        activeDealsCount: activeDeals.length,
        totalActiveDealsAmount,
        tasksCount,
        completedTasksCount,
        taskCompletionRate: tasksCount > 0 
          ? Math.round((completedTasksCount / tasksCount) * 100) 
          : 0,
      },
    };
  }
}