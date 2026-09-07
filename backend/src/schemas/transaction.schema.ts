import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId | User;

    @Prop({ required: true, enum: ['income', 'expense', 'investment'] })
    type: string;

    @Prop({ enum: ['buy', 'sell', 'dividend', 'fee', 'transfer', 'other'] })
    investmentAction?: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true })
    category: string;

    @Prop()
    description: string;

    @Prop()
    paymentMethod?: string;

    @Prop({ required: true, default: Date.now })
    date: Date;

    @Prop({ default: false })
    isRecurring: boolean;

    @Prop()
    recurringDay?: number;

    @Prop()
    symbol?: string;

    @Prop()
    isin?: string;

    @Prop({ min: 0 })
    quantity?: number;

    @Prop({ min: 0 })
    price?: number;

    @Prop({ min: 0, default: 0 })
    fees?: number;

    @Prop({ enum: ['manual', 'indmoney', 'csv', 'other'], default: 'manual' })
    source?: string;

    @Prop()
    externalId?: string;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, date: -1 });
