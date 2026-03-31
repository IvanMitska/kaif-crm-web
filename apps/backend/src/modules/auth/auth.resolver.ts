import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('twoFactorCode', { nullable: true }) twoFactorCode?: string,
  ) {
    const result = await this.authService.login({ email, password, twoFactorCode });
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('organizationName') organizationName: string,
    @Args('middleName', { nullable: true }) middleName?: string,
    @Args('phone', { nullable: true }) phone?: string,
  ) {
    const result = await this.authService.register({
      email,
      password,
      firstName,
      lastName,
      organizationName,
      middleName,
      phone,
    });
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async refreshTokens(@Args('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshTokens({ refreshToken });
    return JSON.stringify(result);
  }

  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return JSON.stringify(user);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: any,
    @Args('refreshToken') refreshToken: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
    return true;
  }
}