import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

class RateLimit {
  @Prop({ required: true, default: 60 })
  requestsPerMinute: number;

  @Prop({ required: true, default: 10000 })
  requestsPerDay: number;
}

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string; // Hashed API key

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], required: true })
  scopes: string[];

  @Prop({ type: RateLimit, required: true, default: { requestsPerMinute: 60, requestsPerDay: 10000 } })
  rateLimit: RateLimit;

  @Prop({ type: [String] })
  ipWhitelist?: string[];

  @Prop()
  expiresAt?: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop()
  lastUsedAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Create indexes
ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ key: 1 }, { unique: true });
ApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expiration