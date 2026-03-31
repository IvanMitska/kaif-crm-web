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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую активность' })
  create(
    @Body() createActivityDto: CreateActivityDto,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.activitiesService.create(createActivityDto, user.id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все активности' })
  findAll(
    @Query() filters: any,
    @CurrentOrg() organizationId: string,
  ) {
    return this.activitiesService.findAll(filters, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить активность по ID' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.activitiesService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить активность' })
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.activitiesService.update(id, updateActivityDto, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить активность' })
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.activitiesService.remove(id, organizationId);
  }
}
