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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';

@ApiTags('Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrganizationGuard)
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую автоматизацию' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  create(
    @Body() createAutomationDto: CreateAutomationDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.automationService.create(createAutomationDto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все автоматизации' })
  findAll(@CurrentOrg() organizationId: string) {
    return this.automationService.findAll(organizationId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные автоматизации' })
  getActiveAutomations(@CurrentOrg() organizationId: string) {
    return this.automationService.getActiveAutomations(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить автоматизацию по ID' })
  findOne(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.automationService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить автоматизацию' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.automationService.update(id, updateAutomationDto, organizationId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Выполнить автоматизацию' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  execute(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.automationService.execute(id, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить автоматизацию' })
  @OrgRoles(OrgRole.OWNER)
  remove(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.automationService.remove(id, organizationId);
  }
}