import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Task, TaskStatus, TaskPriority } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksFilterDto } from './dto/tasks-filter.dto';
import { CalendarFilterDto } from './dto/calendar-filter.dto';
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        assigneeId: createTaskDto.assigneeId || userId,
        createdById: userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contact: true,
        deal: {
          include: {
            stage: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Создаем уведомление для исполнителя
    if (task.assigneeId !== userId) {
      await this.createNotification(
        task.assigneeId,
        'task_assigned',
        `Вам назначена новая задача: ${task.title}`,
        { taskId: task.id }
      );
    }

    // Если задача связана с контактом или сделкой, создаем активность
    if (task.contactId) {
      await this.createActivity(task.contactId, null, userId, 'task_created', {
        taskTitle: task.title,
        taskId: task.id,
      });
    }
    if (task.dealId) {
      await this.createActivity(null, task.dealId, userId, 'task_created', {
        taskTitle: task.title,
        taskId: task.id,
      });
    }

    return task;
  }

  async findAll(filter: TasksFilterDto, userId: string, userRole: string) {
    const {
      skip = 0,
      take = 20,
      search,
      status,
      priority,
      assigneeId,
      contactId,
      dealId,
      dueDateFrom,
      dueDateTo,
      overdue,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = filter;

    const where: Prisma.TaskWhereInput = {
      ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' 
        ? { assigneeId: userId } 
        : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(dealId ? { dealId } : {}),
      ...(dueDateFrom || dueDateTo ? {
        dueDate: {
          ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
          ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
        },
      } : {}),
      ...(overdue ? {
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.COMPLETED },
      } : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          contact: true,
          deal: {
            include: {
              stage: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const task = await this.prisma.task.findUnique({
      where: { 
        id,
        ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' 
          ? { assigneeId: userId } 
          : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contact: {
          include: {
            company: true,
          },
        },
        deal: {
          include: {
            stage: {
              include: {
                pipeline: true,
              },
            },
            contact: true,
            company: true,
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

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: string) {
    const task = await this.findOne(id, userId, userRole);

    const oldAssigneeId = task.assigneeId;
    const oldStatus = task.status;

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contact: true,
        deal: {
          include: {
            stage: true,
          },
        },
      },
    });

    // Уведомление при смене исполнителя
    if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== oldAssigneeId) {
      await this.createNotification(
        updateTaskDto.assigneeId,
        'task_assigned',
        `Вам назначена задача: ${updated.title}`,
        { taskId: updated.id }
      );
    }

    // Уведомление при завершении задачи
    if (updateTaskDto.status === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
      updated.completedAt = new Date();
      
      if (updated.createdById !== userId) {
        await this.createNotification(
          updated.createdById,
          'task_completed',
          `Задача "${updated.title}" выполнена`,
          { taskId: updated.id, completedBy: userId }
        );
      }

      // Создаем активность
      if (updated.contactId) {
        await this.createActivity(updated.contactId, null, userId, 'task_completed', {
          taskTitle: updated.title,
          taskId: updated.id,
        });
      }
      if (updated.dealId) {
        await this.createActivity(null, updated.dealId, userId, 'task_completed', {
          taskTitle: updated.title,
          taskId: updated.id,
        });
      }
    }

    return updated;
  }

  async remove(id: string, userId: string, userRole: string) {
    await this.findOne(id, userId, userRole);

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Задача успешно удалена' };
  }

  async completeTask(id: string, userId: string, userRole: string) {
    return this.update(
      id,
      { 
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
      userId,
      userRole
    );
  }

  async getCalendarTasks(filter: CalendarFilterDto, userId: string, userRole: string) {
    const { view = 'month', date = new Date().toISOString() } = filter;

    let startDate: Date;
    let endDate: Date;

    const baseDate = new Date(date);

    switch (view) {
      case 'day':
        startDate = startOfDay(baseDate);
        endDate = endOfDay(baseDate);
        break;
      case 'week':
        startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
        endDate = endOfWeek(baseDate, { weekStartsOn: 1 });
        break;
      case 'month':
      default:
        startDate = startOfMonth(baseDate);
        endDate = endOfMonth(baseDate);
        break;
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        ...(userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' 
          ? { assigneeId: userId } 
          : {}),
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Группируем задачи по дням
    const tasksByDate = tasks.reduce((acc, task) => {
      if (!task.dueDate) return acc;
      
      const dateKey = task.dueDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);

    return {
      startDate,
      endDate,
      view,
      tasks: tasksByDate,
      totalTasks: tasks.length,
    };
  }

  async getTaskStats(userId: string, userRole: string) {
    const where = userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' 
      ? { assigneeId: userId } 
      : {};

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      weekTasks,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ 
        where: { ...where, status: TaskStatus.COMPLETED } 
      }),
      this.prisma.task.count({ 
        where: { ...where, status: TaskStatus.PENDING } 
      }),
      this.prisma.task.count({ 
        where: {
          ...where,
          status: { not: TaskStatus.COMPLETED },
          dueDate: { lt: new Date() },
        } 
      }),
      this.prisma.task.count({ 
        where: {
          ...where,
          dueDate: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        } 
      }),
      this.prisma.task.count({ 
        where: {
          ...where,
          dueDate: {
            gte: startOfWeek(new Date(), { weekStartsOn: 1 }),
            lte: endOfWeek(new Date(), { weekStartsOn: 1 }),
          },
        } 
      }),
    ]);

    const tasksByPriority = await this.prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true,
      },
    });

    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    return {
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        todayTasks,
        weekTasks,
        completionRate: totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0,
      },
      byPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.id;
        return acc;
      }, {} as Record<TaskPriority, number>),
      byStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<TaskStatus, number>),
    };
  }

  async createRecurringTask(createTaskDto: CreateTaskDto, pattern: string, userId: string) {
    // Паттерн: daily, weekly, monthly
    const tasks = [];
    const baseTask = { ...createTaskDto };
    
    for (let i = 0; i < 12; i++) {
      let dueDate = baseTask.dueDate ? new Date(baseTask.dueDate) : new Date();
      
      switch (pattern) {
        case 'daily':
          dueDate = addDays(dueDate, i);
          break;
        case 'weekly':
          dueDate = addDays(dueDate, i * 7);
          break;
        case 'monthly':
          dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + i));
          break;
      }

      const task = await this.create(
        {
          ...baseTask,
          title: `${baseTask.title} - ${i + 1}`,
          dueDate: dueDate.toISOString(),
        },
        userId
      );
      
      tasks.push(task);
      
      if (pattern === 'daily' && i >= 30) break; // Максимум 30 дней для ежедневных
      if (pattern === 'weekly' && i >= 12) break; // Максимум 12 недель для еженедельных
    }

    return {
      message: `Создано ${tasks.length} повторяющихся задач`,
      tasks,
    };
  }

  private async createNotification(
    userId: string,
    type: string,
    title: string,
    metadata?: any
  ) {
    await this.prisma.notification.create({
      data: {
        type,
        title,
        content: title,
        metadata,
        userId,
      },
    });
  }

  private async createActivity(
    contactId: string | null,
    dealId: string | null,
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
        dealId,
        userId,
      },
    });
  }

  private getActivityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      task_created: 'Задача создана',
      task_completed: 'Задача выполнена',
      task_updated: 'Задача обновлена',
    };
    return descriptions[type] || type;
  }
}