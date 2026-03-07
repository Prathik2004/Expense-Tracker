import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PortfolioEntryDocument = PortfolioEntry & Document;

@Schema({ timestamps: true })
export class PortfolioEntry {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    category: string;

    @Prop({ required: true })
    amount: number;

    @Prop()
    description: string;

    @Prop({ required: true })
    date: Date;
}

export const PortfolioEntrySchema = SchemaFactory.createForClass(PortfolioEntry);
