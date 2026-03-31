import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksFilterDto } from './dto/tasks-filter.dto';
import { CalendarFilterDto } from './dto/calendar-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую задачу' })
  @ApiResponse({ status: 201, description: 'Задача успешно создана' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.create(createTaskDto, user.id, organizationId);
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Создать повторяющуюся задачу' })
  @ApiResponse({ status: 201, description: 'Повторяющиеся задачи созданы' })
  createRecurring(
    @Body() createTaskDto: CreateTaskDto,
    @Body('pattern') pattern: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.createRecurringTask(createTaskDto, pattern, user.id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список задач' })
  @ApiResponse({ status: 200, description: 'Список задач' })
  findAll(
    @Query() filter: TasksFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.findAll(filter, organizationId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Получить задачи для календаря' })
  @ApiResponse({ status: 200, description: 'Задачи для календаря' })
  getCalendarTasks(
    @Query() filter: CalendarFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.getCalendarTasks(filter, organizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по задачам' })
  @ApiResponse({ status: 200, description: 'Статистика задач' })
  getTaskStats(
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.getTaskStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача найдена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задачу' })
  @ApiResponse({ status: 200, description: 'Задача обновлена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id, organizationId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Отметить задачу как выполненную' })
  @ApiResponse({ status: 200, description: 'Задача выполнена' })
  completeTask(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.completeTask(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  @ApiResponse({ status: 200, description: 'Задача удалена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.tasksService.remove(id, organizationId);
  }
}