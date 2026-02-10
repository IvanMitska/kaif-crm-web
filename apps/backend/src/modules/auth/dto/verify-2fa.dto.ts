import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: 'Код из приложения аутентификатора' })
  @IsString()
  @Length(6, 6)
  code: string;
}