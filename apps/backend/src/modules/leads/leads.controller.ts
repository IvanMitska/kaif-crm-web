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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsFilterDto } from './dto/leads-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый лид' })
  @ApiResponse({ status: 201, description: 'Лид успешно создан' })
  create(
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.create(createLeadDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список лидов' })
  @ApiResponse({ status: 200, description: 'Список лидов' })
  findAll(
    @Query() filter: LeadsFilterDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.findAll(filter, user.id, user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по лидам' })
  @ApiResponse({ status: 200, description: 'Статистика лидов' })
  getStats(@CurrentUser() user: any) {
    return this.leadsService.getStats(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить лид по ID' })
  @ApiResponse({ status: 200, description: 'Лид найден' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить лид' })
  @ApiResponse({ status: 200, description: 'Лид обновлен' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, updateLeadDto, user.id, user.role);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Конвертировать лид в контакт/сделку' })
  @ApiResponse({ status: 200, description: 'Лид конвертирован' })
  convert(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.convert(id, data, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить лид' })
  @ApiResponse({ status: 200, description: 'Лид удален' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.remove(id, user.id, user.role);
  }
}
