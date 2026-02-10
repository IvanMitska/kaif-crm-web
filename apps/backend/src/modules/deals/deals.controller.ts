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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { DealsFilterDto } from './dto/deals-filter.dto';
import { MoveDealDto } from './dto/move-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую сделку' })
  @ApiResponse({ status: 201, description: 'Сделка успешно создана' })
  create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.create(createDealDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список сделок' })
  @ApiResponse({ status: 200, description: 'Список сделок' })
  findAll(
    @Query() filter: DealsFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.findAll(filter, user.id, user.role);
  }

  @Get('pipeline/:pipelineId')
  @ApiOperation({ summary: 'Получить сделки по этапам воронки' })
  @ApiResponse({ status: 200, description: 'Сделки сгруппированные по этапам' })
  getDealsByStage(
    @Param('pipelineId') pipelineId: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.getDealsByStage(pipelineId, user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сделку по ID' })
  @ApiResponse({ status: 200, description: 'Сделка найдена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.findOne(id, user.id, user.role);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по сделке' })
  @ApiResponse({ status: 200, description: 'Статистика сделки' })
  getDealStats(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.getDealStats(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сделку' })
  @ApiResponse({ status: 200, description: 'Сделка обновлена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.update(id, updateDealDto, user.id, user.role);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Переместить сделку на другой этап' })
  @ApiResponse({ status: 200, description: 'Сделка перемещена' })
  moveDeal(
    @Param('id') id: string,
    @Body() moveDealDto: MoveDealDto,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.moveDeal(id, moveDealDto, user.id, user.role);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Дублировать сделку' })
  @ApiResponse({ status: 201, description: 'Сделка дублирована' })
  duplicateDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.duplicateDeal(id, user.id, user.role);
  }

  @Post(':id/won')
  @ApiOperation({ summary: 'Отметить сделку как выигранную' })
  @ApiResponse({ status: 200, description: 'Сделка отмечена как выигранная' })
  wonDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.closeDeal(id, true, user.id, user.role);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Отметить сделку как проигранную' })
  @ApiResponse({ status: 200, description: 'Сделка отмечена как проигранная' })
  lostDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.closeDeal(id, false, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сделку' })
  @ApiResponse({ status: 200, description: 'Сделка удалена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.dealsService.remove(id, user.id, user.role);
  }
}