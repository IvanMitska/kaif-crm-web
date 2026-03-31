import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DealsModule } from './modules/deals/deals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LeadsModule } from './modules/leads/leads.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // In-memory cache (no Redis required)
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
      max: 100, // maximum number of items in cache
    }),

    // Core modules
    PrismaModule,
    EmailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    CompaniesModule,
    DealsModule,
    TasksModule,
    MessagesModule,
    AnalyticsModule,
    NotificationsModule,
    LeadsModule,
    InvitationsModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
