import { Document, Schema, Types } from 'mongoose';

export interface PortfolioSyncLog {
    userId: Types.ObjectId;
    trigger: 'manual' | 'cron';
    status: 'running' | 'success' | 'failed' | 'skipped';
    sourceFile?: string;
    message?: string;
    errorMessage?: string;
    categoriesUpdated: number;
    totalValue: number;
    startedAt: Date;
    completedAt?: Date;
}

export type PortfolioSyncLogDocument = PortfolioSyncLog & Document;

export const PortfolioSyncLogSchema = new Schema<PortfolioSyncLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        trigger: { type: String, required: true, enum: ['manual', 'cron'] },
        status: { type: String, required: true, enum: ['running', 'success', 'failed', 'skipped'], default: 'running' },
        sourceFile: { type: String },
        message: { type: String },
        errorMessage: { type: String },
        categoriesUpdated: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        startedAt: { type: Date, required: true },
        completedAt: { type: Date },
    },
    { timestamps: true }
);