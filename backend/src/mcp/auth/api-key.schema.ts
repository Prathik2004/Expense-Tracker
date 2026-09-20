import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerDay: number;
}

export type ApiKeyDocument = ApiKey & Document;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string; // This will store the hashed key

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], required: true })
  scopes: string[]; // e.g., ['portfolio:read', 'budget:read']

  @Prop({
    required: true,
    type: {
      requestsPerMinute: { type: Number, required: true },
      requestsPerDay: { type: Number, required: true },
    },
  })
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
