import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { DealsResolver } from './deals.resolver';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';

@Module({
  controllers: [DealsController, PipelinesController],
  providers: [DealsService, DealsResolver, PipelinesService],
  exports: [DealsService, PipelinesService],
})
export class DealsModule {}