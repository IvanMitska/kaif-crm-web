import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({ example: 'newuser@company.ru', description: 'Email приглашаемого' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.OPERATOR, description: 'Роль в организации' })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
