import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({ example: 'newuser@company.ru', description: 'Email приглашаемого' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.OPERATOR, description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
