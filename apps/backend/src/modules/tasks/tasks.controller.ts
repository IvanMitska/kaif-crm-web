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
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую задачу' })
  @ApiResponse({ status: 201, description: 'Задача успешно создана' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Создать повторяющуюся задачу' })
  @ApiResponse({ status: 201, description: 'Повторяющиеся задачи созданы' })
  createRecurring(
    @Body() createTaskDto: CreateTaskDto,
    @Body('pattern') pattern: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.createRecurringTask(createTaskDto, pattern, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список задач' })
  @ApiResponse({ status: 200, description: 'Список задач' })
  findAll(
    @Query() filter: TasksFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findAll(filter, user.id, user.role);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Получить задачи для календаря' })
  @ApiResponse({ status: 200, description: 'Задачи для календаря' })
  getCalendarTasks(
    @Query() filter: CalendarFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getCalendarTasks(filter, user.id, user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по задачам' })
  @ApiResponse({ status: 200, description: 'Статистика задач' })
  getTaskStats(@CurrentUser() user: any) {
    return this.tasksService.getTaskStats(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача найдена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задачу' })
  @ApiResponse({ status: 200, description: 'Задача обновлена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id, user.role);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Отметить задачу как выполненную' })
  @ApiResponse({ status: 200, description: 'Задача выполнена' })
  completeTask(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.completeTask(id, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  @ApiResponse({ status: 200, description: 'Задача удалена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.remove(id, user.id, user.role);
  }
}