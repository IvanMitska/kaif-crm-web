import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver('Company')
@UseGuards(JwtAuthGuard)
export class CompaniesResolver {
  constructor(private readonly companiesService: CompaniesService) {}

  @Query(() => String)
  async companies(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('search', { nullable: true }) search?: string,
    @CurrentUser() user?: any,
  ) {
    const result = await this.companiesService.findAll(
      { skip, take, search },
      user.id,
      user.role,
    );
    return JSON.stringify(result);
  }

  @Query(() => String)
  async company(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.companiesService.findOne(id, user.id, user.role);
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async createCompany(
    @Args('name') name: string,
    @Args('inn', { nullable: true }) inn?: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('phone', { nullable: true }) phone?: string,
    @Args('website', { nullable: true }) website?: string,
    @CurrentUser() user?: any,
  ) {
    const result = await this.companiesService.create(
      { name, inn, email, phone, website },
      user.id,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  async deleteCompany(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.companiesService.remove(id, user.id, user.role);
    return true;
  }
}