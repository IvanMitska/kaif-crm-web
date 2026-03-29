import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    // Basic health check - always returns 200 if app is running
    const response: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    // Try to check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      response.database = 'connected';
    } catch (error) {
      response.database = 'disconnected';
      response.dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    return response;
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    // Simple liveness check - no dependencies
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    // Check if the service is ready to handle traffic
    const isDbConnected = this.prisma.getConnectionStatus();

    return {
      status: isDbConnected ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
    };
  }
}
