import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@Resolver('Contact')
@UseGuards(JwtAuthGuard)
export class ContactsResolver {
  constructor(private readonly contactsService: ContactsService) {}

  @Query(() => String)
  async contacts(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('search', { nullable: true }) search?: string,
    @CurrentUser() user?: any,
    @CurrentOrg() organizationId?: string,
  ) {
    const result = await this.contactsService.findAll(
      { skip, take, search },
      organizationId,
    );
    return JSON.stringify(result);
  }

  @Query(() => String)
  async contact(
    @Args('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    const result = await this.contactsService.findOne(id, organizationId);
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async createContact(
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('phone', { nullable: true }) phone?: string,
    @Args('companyId', { nullable: true }) companyId?: string,
    @CurrentUser() user?: any,
    @CurrentOrg() organizationId?: string,
  ) {
    const result = await this.contactsService.create(
      { firstName, lastName, email, phone, companyId },
      user.id,
      organizationId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => Boolean)
  async deleteContact(
    @Args('id') id: string,
    @CurrentUser() user: any,
    @CurrentOrg() organizationId: string,
  ) {
    await this.contactsService.remove(id, organizationId);
    return true;
  }
}
