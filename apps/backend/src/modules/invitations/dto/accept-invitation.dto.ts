import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Токен приглашения' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Пароль', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;

  @ApiProperty({ description: 'Имя' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Фамилия' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Телефон' })
  @IsOptional()
  @IsString()
  phone?: string;
}
