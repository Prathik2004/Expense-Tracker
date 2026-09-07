import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type PortfolioSnapshotDocument = PortfolioSnapshot & Document;

@Schema({ timestamps: true })
export class PortfolioSnapshot {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    capturedAt: Date;

    @Prop({ required: true, min: 0 })
    investedAmount: number;

    @Prop({ required: true, min: 0 })
    currentValue: number;

    @Prop({ required: true, enum: ['manual', 'excel', 'indmoney', 'combined'] })
    source: string;

    @Prop()
    syncId?: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    allocation?: Record<string, number>;
}

export const PortfolioSnapshotSchema = SchemaFactory.createForClass(PortfolioSnapshot);
PortfolioSnapshotSchema.index({ userId: 1, capturedAt: -1 });
