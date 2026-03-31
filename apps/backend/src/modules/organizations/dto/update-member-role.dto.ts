import { IsEnum } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(OrgRole, { message: 'Некорректная роль' })
  role: OrgRole;
}
