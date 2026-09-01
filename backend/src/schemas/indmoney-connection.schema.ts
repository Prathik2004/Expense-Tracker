import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IndmoneyConnectionDocument = IndmoneyConnection & Document;

@Schema({ timestamps: true })
export class IndmoneyConnection {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'indmoney' })
  provider: string;

  @Prop({ required: true, enum: ['connected', 'expired', 'revoked', 'error', 'disconnected'], default: 'connected' })
  status: string;

  @Prop()
  accessTokenEncrypted?: string;

  @Prop()
  refreshTokenEncrypted?: string;

  @Prop()
  tokenExpiresAt?: Date;

  @Prop({ type: [String] })
  scopes?: string[];

  @Prop()
  connectedAt?: Date;

  @Prop()
  lastSyncedAt?: Date;

  @Prop()
  lastSyncStatus?: string;

  @Prop()
  lastSyncError?: string;
}

export const IndmoneyConnectionSchema = SchemaFactory.createForClass(IndmoneyConnection);
IndmoneyConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });
