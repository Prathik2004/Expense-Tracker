import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Goal } from './goal.schema';

export type LiquidFundTransactionDocument = LiquidFundTransaction & Document;

export enum LiquidFundTransactionType {
  INVEST = 'INVEST',
  RETURN = 'RETURN',
  WITHDRAW = 'WITHDRAW',
}

@Schema({ timestamps: true })
export class LiquidFundTransaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId | User;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ required: true })
  fundName: string;

  @Prop({ required: true })
  bucket: string;

  @Prop({ required: true, enum: LiquidFundTransactionType })
  transactionType: LiquidFundTransactionType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Goal', required: false })
  goalId?: MongooseSchema.Types.ObjectId | Goal;

  @Prop()
  notes?: string;
}

export const LiquidFundTransactionSchema = SchemaFactory.createForClass(LiquidFundTransaction);

LiquidFundTransactionSchema.index({ userId: 1, date: -1 });
LiquidFundTransactionSchema.index({ userId: 1, goalId: 1 });
LiquidFundTransactionSchema.index({ userId: 1, bucket: 1 });