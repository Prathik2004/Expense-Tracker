import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

export interface AuditLogInput {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  tool: string;
  statusCode: number;
  parameters?: Record<string, any>;
  resultCount?: number;
  duration: number;
  ipAddress: string;
  userAgent?: string;
  error?: string;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);
  private readonly SENSITIVE_FIELDS = ['password', 'apiKey', 'secret', 'token', 'key'];

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      // Sanitize parameters to remove sensitive data
      const sanitizedParameters = this.sanitizeParameters(input.parameters);

      const auditLog = new this.auditLogModel({
        ...input,
        parameters: sanitizedParameters,
        timestamp: new Date(),
      });

      await auditLog.save();

      this.logger.debug(
        `Audit log created: ${input.tool} by API key ${input.apiKeyId} (${input.duration}ms)`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  async getLogs(
    userId?: string,
    apiKeyId?: string,
    tool?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const query: any = {};

    if (userId) query.userId = userId;
    if (apiKeyId) query.apiKeyId = apiKeyId;
    if (tool) query.tool = tool;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query),
    ]);

    return { logs, total };
  }

  async getStats(userId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditLogModel.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$tool',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          errorCount: {
            $sum: { $cond: [{ $ne: ['$error', null] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return stats;
  }

  private sanitizeParameters(params?: Record<string, any>): Record<string, any> {
    if (!params) return {};

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      // Check if the key is sensitive
      if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeParameters(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
