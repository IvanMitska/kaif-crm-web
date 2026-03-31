import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@Resolver('Deal')
@UseGuards(JwtAuthGuard)
export class DealsResolver {
  constructor(private readonly dealsService: DealsService) {}

  @Query(() => String)
  async deals(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('search', { nullable: true }) search?: string,
    @Args('pipelineId', { nullable: true }) pipelineId?: string,
    @CurrentUser() user?: any,
    @CurrentOrg() organizationId?: string,
  ) {
    const result = await this.dealsService.findAll(
      { skip, take, search, pipelineId },
      organizationId,
    );
    return JSON.stringify(result);
  }

  @Query(() => String)
  async deal(
    @Args('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    const result = await this.dealsService.findOne(id, organizationId);
    return JSON.stringify(result);
  }

  @Query(() => String)
  async dealsByStage(
    @Args('pipelineId') pipelineId: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    const result = await this.dealsService.getDealsByStage(pipelineId, organizationId);
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async createDeal(
    @Args('title') title: string,
    @Args('amount', { type: () => Int }) amount: number,
    @Args('contactId', { nullable: true }) contactId?: string,
    @Args('companyId', { nullable: true }) companyId?: string,
    @CurrentUser() user?: any,
    @CurrentOrg() organizationId?: string,
  ) {
    const result = await this.dealsService.create(
      { title, amount, contactId, companyId },
      user.id,
      organizationId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async moveDeal(
    @Args('dealId') dealId: string,
    @Args('stageId') stageId: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    const result = await this.dealsService.moveDeal(
      dealId,
      { stageId },
      user.id,
      organizationId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  async deleteDeal(
    @Args('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    await this.dealsService.remove(id, organizationId);
    return true;
  }
}
