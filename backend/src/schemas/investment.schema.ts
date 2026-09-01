import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvestmentDocument = Investment & Document;

@Schema({ timestamps: true })
export class Investment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 'indmoney' })
  source: string;

  @Prop({ required: true })
  externalId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  assetType?: string;

  @Prop()
  symbol?: string;

  @Prop()
  isin?: string;

  @Prop()
  quantity?: number;

  @Prop()
  averagePrice?: number;

  @Prop()
  currentPrice?: number;

  @Prop({ required: true, default: 0 })
  investedAmount: number;

  @Prop({ required: true, default: 0 })
  currentValue: number;

  @Prop()
  profitLoss?: number;

  @Prop()
  profitLossPercentage?: number;

  @Prop()
  currency?: string;

  @Prop()
  broker?: string;

  @Prop()
  sector?: string;

  @Prop()
  marketCap?: string;

  @Prop()
  lastSyncedAt?: Date;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);
InvestmentSchema.index({ userId: 1, source: 1, externalId: 1 }, { unique: true });
