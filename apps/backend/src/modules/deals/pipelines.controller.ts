import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('pipelines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Создать новую воронку продаж' })
  @ApiResponse({ status: 201, description: 'Воронка успешно создана' })
  create(@Body() createPipelineDto: CreatePipelineDto) {
    return this.pipelinesService.create(createPipelineDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список воронок' })
  @ApiResponse({ status: 200, description: 'Список воронок' })
  findAll() {
    return this.pipelinesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить воронку по ID' })
  @ApiResponse({ status: 200, description: 'Воронка найдена' })
  @ApiResponse({ status: 404, description: 'Воронка не найдена' })
  findOne(@Param('id') id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Обновить воронку' })
  @ApiResponse({ status: 200, description: 'Воронка обновлена' })
  @ApiResponse({ status: 404, description: 'Воронка не найдена' })
  update(
    @Param('id') id: string,
    @Body() updatePipelineDto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.update(id, updatePipelineDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить воронку' })
  @ApiResponse({ status: 200, description: 'Воронка удалена' })
  @ApiResponse({ status: 404, description: 'Воронка не найдена' })
  @ApiResponse({ status: 400, description: 'Невозможно удалить воронку' })
  remove(@Param('id') id: string) {
    return this.pipelinesService.remove(id);
  }

  @Post(':id/stages')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Добавить этап в воронку' })
  @ApiResponse({ status: 201, description: 'Этап добавлен' })
  createStage(
    @Param('id') pipelineId: string,
    @Body() createStageDto: CreateStageDto,
  ) {
    return this.pipelinesService.createStage(pipelineId, createStageDto);
  }

  @Patch('stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Обновить этап' })
  @ApiResponse({ status: 200, description: 'Этап обновлен' })
  @ApiResponse({ status: 404, description: 'Этап не найден' })
  updateStage(
    @Param('stageId') stageId: string,
    @Body() updateStageDto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStage(stageId, updateStageDto);
  }

  @Delete('stages/:stageId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить этап' })
  @ApiResponse({ status: 200, description: 'Этап удален' })
  @ApiResponse({ status: 404, description: 'Этап не найден' })
  @ApiResponse({ status: 400, description: 'Невозможно удалить этап' })
  removeStage(@Param('stageId') stageId: string) {
    return this.pipelinesService.removeStage(stageId);
  }

  @Post(':id/stages/reorder')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Изменить порядок этапов' })
  @ApiResponse({ status: 200, description: 'Порядок этапов изменен' })
  reorderStages(
    @Param('id') pipelineId: string,
    @Body('stageIds') stageIds: string[],
  ) {
    return this.pipelinesService.reorderStages(pipelineId, stageIds);
  }
}