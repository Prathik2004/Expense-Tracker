import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId | User;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true, min: 0 })
    monthlyLimit: number;

    @Prop({ required: true })
    month: string; // Format: YYYY-MM
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
