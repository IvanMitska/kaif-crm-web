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
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую сделку' })
  @ApiResponse({ status: 201, description: 'Сделка успешно создана' })
  create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.create(createDealDto, user.id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список сделок' })
  @ApiResponse({ status: 200, description: 'Список сделок' })
  findAll(
    @Query() filter: DealsFilterDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.findAll(filter, organizationId);
  }

  @Get('pipeline/:pipelineId')
  @ApiOperation({ summary: 'Получить сделки по этапам воронки' })
  @ApiResponse({ status: 200, description: 'Сделки сгруппированные по этапам' })
  getDealsByStage(
    @Param('pipelineId') pipelineId: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.getDealsByStage(pipelineId, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сделку по ID' })
  @ApiResponse({ status: 200, description: 'Сделка найдена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.findOne(id, organizationId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Получить статистику по сделке' })
  @ApiResponse({ status: 200, description: 'Статистика сделки' })
  getDealStats(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.getDealStats(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сделку' })
  @ApiResponse({ status: 200, description: 'Сделка обновлена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.update(id, updateDealDto, user.id, organizationId);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Переместить сделку на другой этап' })
  @ApiResponse({ status: 200, description: 'Сделка перемещена' })
  moveDeal(
    @Param('id') id: string,
    @Body() moveDealDto: MoveDealDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.moveDeal(id, moveDealDto, user.id, organizationId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Дублировать сделку' })
  @ApiResponse({ status: 201, description: 'Сделка дублирована' })
  duplicateDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.duplicateDeal(id, user.id, organizationId);
  }

  @Post(':id/won')
  @ApiOperation({ summary: 'Отметить сделку как выигранную' })
  @ApiResponse({ status: 200, description: 'Сделка отмечена как выигранная' })
  wonDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.closeDeal(id, true, user.id, organizationId);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Отметить сделку как проигранную' })
  @ApiResponse({ status: 200, description: 'Сделка отмечена как проигранная' })
  lostDeal(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.closeDeal(id, false, user.id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сделку' })
  @ApiResponse({ status: 200, description: 'Сделка удалена' })
  @ApiResponse({ status: 404, description: 'Сделка не найдена' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.dealsService.remove(id, organizationId);
  }
}