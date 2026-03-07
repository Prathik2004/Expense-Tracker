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

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true })
    category: string;

    @Prop()
    description: string;

    @Prop({ required: true, default: Date.now })
    date: Date;

    @Prop({ default: false })
    isRecurring: boolean;

    @Prop()
    recurringDay?: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
