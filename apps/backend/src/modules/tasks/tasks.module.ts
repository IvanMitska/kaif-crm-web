import { Module, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksResolver } from './tasks.resolver';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [forwardRef(() => AutomationModule)],
  controllers: [TasksController],
  providers: [TasksService, TasksResolver],
  exports: [TasksService],
})
export class TasksModule {}