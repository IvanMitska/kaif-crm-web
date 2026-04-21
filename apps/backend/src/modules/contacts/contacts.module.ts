import { Module, forwardRef } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsResolver } from './contacts.resolver';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [forwardRef(() => AutomationModule)],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsResolver],
  exports: [ContactsService],
})
export class ContactsModule {}