import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.user.count();

    return {
      status: 'ok',
      database: 'connected',
      service: 'notification-platform-api',
      timestamp: new Date().toISOString(),
    };
  }
}