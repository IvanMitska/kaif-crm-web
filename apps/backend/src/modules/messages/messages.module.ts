import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WebsocketsModule)],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}