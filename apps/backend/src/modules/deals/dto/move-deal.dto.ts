import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveDealDto {
  @ApiProperty({ description: 'ID нового этапа' })
  @IsUUID()
  stageId: string;
}