import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CalendarView {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class CalendarFilterDto {
  @ApiPropertyOptional({ 
    enum: CalendarView, 
    default: CalendarView.MONTH,
    description: 'Вид календаря' 
  })
  @IsOptional()
  @IsEnum(CalendarView)
  view?: CalendarView;

  @ApiPropertyOptional({ 
    example: '2024-01-01',
    description: 'Дата для отображения календаря' 
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}