import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
  @ApiProperty({ description: 'Пароль для подтверждения' })
  @IsString()
  password: string;
}