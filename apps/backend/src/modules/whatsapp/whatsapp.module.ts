import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => MessagesModule),
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
