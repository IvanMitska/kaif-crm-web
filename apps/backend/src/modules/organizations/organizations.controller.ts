import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  @UseGuards(OrganizationGuard)
  getCurrentOrganization(@CurrentOrg() organizationId: string) {
    return this.organizationsService.findById(organizationId);
  }

  @Patch('current')
  @UseGuards(OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  updateCurrentOrganization(
    @CurrentOrg() organizationId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(organizationId, updateOrganizationDto);
  }

  @Delete('current')
  @UseGuards(OrganizationGuard)
  @OrgRoles(OrgRole.OWNER)
  deleteCurrentOrganization(@CurrentOrg() organizationId: string) {
    return this.organizationsService.delete(organizationId);
  }

  // Members management
  @Get('current/members')
  @UseGuards(OrganizationGuard)
  getMembers(@CurrentOrg() organizationId: string) {
    return this.organizationsService.getMembers(organizationId);
  }

  @Get('current/members/:memberId')
  @UseGuards(OrganizationGuard)
  getMember(
    @CurrentOrg() organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.getMember(organizationId, memberId);
  }

  @Patch('current/members/:memberId/role')
  @UseGuards(OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  updateMemberRole(
    @CurrentOrg() organizationId: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.organizationsService.updateMemberRole(
      organizationId,
      memberId,
      updateMemberRoleDto,
      requesterId,
    );
  }

  @Patch('current/members/:memberId/toggle-active')
  @UseGuards(OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  toggleMemberActive(
    @CurrentOrg() organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationsService.toggleMemberActive(organizationId, memberId);
  }

  @Delete('current/members/:memberId')
  @UseGuards(OrganizationGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  removeMember(
    @CurrentOrg() organizationId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.organizationsService.removeMember(organizationId, memberId, requesterId);
  }

  // User's organizations
  @Get('my')
  getMyOrganizations(@CurrentUser('id') userId: string) {
    return this.organizationsService.getUserOrganizations(userId);
  }
}
