import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver('User')
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => String)
  async me(@CurrentUser() user: any) {
    const result = await this.usersService.findOne(user.id);
    return JSON.stringify(result);
  }

  @Query(() => String)
  async user(
    @Args('id') id: string,
  ) {
    const result = await this.usersService.findOne(id);
    return JSON.stringify(result);
  }

  @Query(() => String)
  async users(
    @Args('skip', { nullable: true }) skip?: number,
    @Args('take', { nullable: true }) take?: number,
  ) {
    const result = await this.usersService.findAll({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return JSON.stringify(result);
  }
}