import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole, InvitationStatus } from '@prisma/client';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать приглашение (только админ или владелец)' })
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser('id') userId: string,
    @CurrentOrg() organizationId: string,
  ) {
    return this.invitationsService.create(dto, userId, organizationId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Список приглашений организации' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: InvitationStatus })
  findAll(
    @CurrentOrg() organizationId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: InvitationStatus,
  ) {
    return this.invitationsService.findAll(organizationId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status,
    });
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Получить приглашение по токену (публичный)' })
  findByToken(@Param('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Принять приглашение и зарегистрироваться (публичный)' })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.accept(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отменить приглашение' })
  cancel(@Param('id') id: string) {
    return this.invitationsService.cancel(id);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Переотправить приглашение' })
  resend(@Param('id') id: string) {
    return this.invitationsService.resend(id);
  }
}
