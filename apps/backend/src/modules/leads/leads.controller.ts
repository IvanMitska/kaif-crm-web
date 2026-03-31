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
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новый лид' })
  @ApiResponse({ status: 201, description: 'Лид успешно создан' })
  create(
    @Body() createLeadDto: CreateLeadDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.create(createLeadDto, user.id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список лидов' })
  @ApiResponse({ status: 200, description: 'Список лидов' })
  findAll(
    @Query() filter: LeadsFilterDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.findAll(filter, organizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику по лидам' })
  @ApiResponse({ status: 200, description: 'Статистика лидов' })
  getStats(@CurrentOrg() organizationId: string) {
    return this.leadsService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить лид по ID' })
  @ApiResponse({ status: 200, description: 'Лид найден' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить лид' })
  @ApiResponse({ status: 200, description: 'Лид обновлен' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.update(id, updateLeadDto, organizationId);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Конвертировать лид в контакт/сделку' })
  @ApiResponse({ status: 200, description: 'Лид конвертирован' })
  convert(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.convert(id, data, user.id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить лид' })
  @ApiResponse({ status: 200, description: 'Лид удален' })
  @ApiResponse({ status: 404, description: 'Лид не найден' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.leadsService.remove(id, organizationId);
  }
}
