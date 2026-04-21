import { Module, forwardRef } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { DealsResolver } from './deals.resolver';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [forwardRef(() => AutomationModule)],
  controllers: [DealsController, PipelinesController],
  providers: [DealsService, DealsResolver, PipelinesService],
  exports: [DealsService, PipelinesService],
})
export class DealsModule {}