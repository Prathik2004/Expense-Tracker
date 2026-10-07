import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async health() {
    const dbState = this.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: states[dbState] || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('warmup')
  async warmup() {
    // Force a quick DB connection test
    try {
      if (!this.connection.db) {
        return { status: 'error', error: 'Database not connected', timestamp: new Date().toISOString() };
      }
      const db = this.connection.db;
      await db.admin().ping();
      return { status: 'warmed', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'error', error: (error as Error).message, timestamp: new Date().toISOString() };
    }
  }
}
