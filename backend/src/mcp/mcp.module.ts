import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MCPController } from './mcp.controller';
import { MCPService } from './mcp.service';
import { HttpTransport } from './transports/http.transport';
import { SSETransport } from './transports/sse.transport';
import { ApiKeyModule } from './auth/api-key.module';
import { SecurityModule } from './security/security.module';
import { ToolsModule } from './tools/tools.module';
import { AuthModule } from '../auth/auth.module';
import { ApiKey, ApiKeySchema } from './auth/api-key.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { mcpConfig } from './config/mcp.config';

@Module({
  imports: [
    ConfigModule.forFeature(mcpConfig),
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    ApiKeyModule,
    AuthModule,
    SecurityModule,
    forwardRef(() => ToolsModule),
  ],
  controllers: [MCPController, OauthDiscoveryController],
  providers: [
    MCPService,
    HttpTransport,
    SSETransport,
    McpAuthExceptionFilter,
  ],
  exports: [MCPService, HttpTransport, SSETransport],
})
export class MCPModule {}