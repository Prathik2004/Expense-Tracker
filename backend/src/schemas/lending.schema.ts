import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Transaction } from './transaction.schema';

export type LendingDocument = Lending & Document;

@Schema({ timestamps: true })
export class Lending {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId | User;

    @Prop({ required: true })
    personName: string;

    @Prop({ required: true })
    reason: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true, default: Date.now })
    date: Date;

    @Prop({ required: true, enum: ['salary', 'other'], default: 'other' })
    source: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction' })
    transactionId?: MongooseSchema.Types.ObjectId | Transaction;
}

export const LendingSchema = SchemaFactory.createForClass(Lending);
