import { Module, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MessagesModule),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
