import { Module, forwardRef } from '@nestjs/common';
import { EmailImapService } from './email-imap.service';
import { EmailImapController } from './email-imap.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, forwardRef(() => MessagesModule)],
  controllers: [EmailImapController],
  providers: [EmailImapService],
  exports: [EmailImapService],
})
export class EmailImapModule {}
