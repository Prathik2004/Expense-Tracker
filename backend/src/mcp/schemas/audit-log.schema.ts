import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, required: true })
  apiKeyId: Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  tool: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ type: Object })
  parameters: Record<string, any>; // Sanitized parameters

  @Prop()
  resultCount?: number;

  @Prop({ required: true })
  duration: number; // in milliseconds

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  error?: string;

  @Prop({ default: () => new Date() })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create TTL index to auto-delete logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days in seconds
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ apiKeyId: 1, timestamp: -1 });
AuditLogSchema.index({ tool: 1, timestamp: -1 });
