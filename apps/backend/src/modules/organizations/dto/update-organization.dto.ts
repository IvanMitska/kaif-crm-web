import { IsString, IsOptional, Matches, IsIn } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug может содержать только строчные буквы, цифры и дефисы',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  @IsIn(['THB', 'RUB', 'USD', 'EUR'], {
    message: 'Валюта должна быть одной из: THB, RUB, USD, EUR',
  })
  currency?: string;
}
