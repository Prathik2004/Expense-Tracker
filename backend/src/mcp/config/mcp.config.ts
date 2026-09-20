import { registerAs } from '@nestjs/config';

export const mcpConfig = registerAs('mcp', () => ({
  port: parseInt(process.env.MCP_PORT ?? '3001', 10),
  host: process.env.MCP_HOST ?? '0.0.0.0',

  // API Key settings
  apiKeyExpiryDays: parseInt(process.env.API_KEY_EXPIRY_DAYS ?? '365', 10),
  apiKeyMaxAgeDays: parseInt(process.env.API_KEY_MAX_AGE_DAYS ?? '90', 10),

  // Rate Limiting defaults
  rateLimitRequestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?? '60', 10),
  rateLimitRequestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR ?? '1000', 10),
  rateLimitRequestsPerDay: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_DAY ?? '10000', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL ?? 'info',
  auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS ?? '90', 10),

  // Security
  enableHttps: process.env.ENABLE_HTTPS === 'true',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
}));