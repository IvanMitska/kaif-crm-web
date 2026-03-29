import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      // Don't throw - allow app to start for healthcheck
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}