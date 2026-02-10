import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список доступных интеграций' })
  getAvailableIntegrations() {
    return this.integrationsService.getAvailableIntegrations();
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Подключить интеграцию' })
  @Roles(UserRole.ADMIN)
  connectIntegration(
    @Param('id') id: string,
    @Body() config: any,
  ) {
    return this.integrationsService.connectIntegration(id, config);
  }

  @Delete(':id/disconnect')
  @ApiOperation({ summary: 'Отключить интеграцию' })
  @Roles(UserRole.ADMIN)
  disconnectIntegration(@Param('id') id: string) {
    return this.integrationsService.disconnectIntegration(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Получить статус интеграции' })
  getIntegrationStatus(@Param('id') id: string) {
    return this.integrationsService.getIntegrationStatus(id);
  }
}