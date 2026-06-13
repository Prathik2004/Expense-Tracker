import { Document, Schema, Types } from 'mongoose';

export interface PortfolioHolding {
    userId: Types.ObjectId;
    category: string;
    amount: number;
    source: 'manual' | 'excel';
    description?: string;
    date?: Date;
    syncedAt?: Date;
}

export type PortfolioHoldingDocument = PortfolioHolding & Document;

export const PortfolioHoldingSchema = new Schema<PortfolioHolding>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        category: { type: String, required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        source: { type: String, required: true, enum: ['manual', 'excel'], default: 'manual' },
        description: { type: String },
        date: { type: Date },
        syncedAt: { type: Date },
    },
    { timestamps: true }
);

PortfolioHoldingSchema.index({ userId: 1, category: 1 }, { unique: true });