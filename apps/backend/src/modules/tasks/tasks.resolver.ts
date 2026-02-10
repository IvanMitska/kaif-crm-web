import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TaskStatus, TaskPriority } from '@prisma/client';

@Resolver('Task')
@UseGuards(JwtAuthGuard)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Query(() => String)
  async tasks(
    @Args('status', { nullable: true }) status?: TaskStatus,
    @Args('priority', { nullable: true }) priority?: TaskPriority,
    @Args('assigneeId', { nullable: true }) assigneeId?: string,
    @CurrentUser() user?: any,
  ) {
    const result = await this.tasksService.findAll(
      { status, priority, assigneeId },
      user.id,
      user.role,
    );
    return JSON.stringify(result);
  }

  @Query(() => String)
  async task(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.tasksService.findOne(id, user.id, user.role);
    return JSON.stringify(result);
  }

  @Query(() => String)
  async calendarTasks(
    @Args('view', { nullable: true }) view?: string,
    @Args('date', { nullable: true }) date?: string,
    @CurrentUser() user?: any,
  ) {
    const result = await this.tasksService.getCalendarTasks(
      { view: view as any, date },
      user.id,
      user.role,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async createTask(
    @Args('title') title: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('dueDate', { nullable: true }) dueDate?: string,
    @Args('priority', { nullable: true }) priority?: TaskPriority,
    @Args('contactId', { nullable: true }) contactId?: string,
    @Args('dealId', { nullable: true }) dealId?: string,
    @CurrentUser() user?: any,
  ) {
    const result = await this.tasksService.create(
      { title, description, dueDate, priority, contactId, dealId },
      user.id,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async completeTask(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.tasksService.completeTask(id, user.id, user.role);
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  async deleteTask(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.tasksService.remove(id, user.id, user.role);
    return true;
  }
}