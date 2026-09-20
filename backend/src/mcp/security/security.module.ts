import { Module, Global } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { AuditLoggerService } from './audit-logger.service';
import { ScopeGuard } from './scope.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
  ],
  providers: [RateLimiterService, AuditLoggerService, ScopeGuard],
  exports: [RateLimiterService, AuditLoggerService, ScopeGuard],
})
export class SecurityModule {}