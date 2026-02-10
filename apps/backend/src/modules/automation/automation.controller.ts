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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую автоматизацию' })
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  create(@Body() createAutomationDto: CreateAutomationDto) {
    return this.automationService.create(createAutomationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все автоматизации' })
  findAll() {
    return this.automationService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Получить активные автоматизации' })
  getActiveAutomations() {
    return this.automationService.getActiveAutomations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить автоматизацию по ID' })
  findOne(@Param('id') id: string) {
    return this.automationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить автоматизацию' })
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  update(@Param('id') id: string, @Body() updateAutomationDto: UpdateAutomationDto) {
    return this.automationService.update(id, updateAutomationDto);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Выполнить автоматизацию' })
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  execute(@Param('id') id: string) {
    return this.automationService.execute(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить автоматизацию' })
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.automationService.remove(id);
  }
}