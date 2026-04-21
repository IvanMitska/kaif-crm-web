import { Module, forwardRef } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [forwardRef(() => AutomationModule)],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
