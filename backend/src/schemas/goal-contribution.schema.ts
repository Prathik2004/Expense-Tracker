import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Goal } from './goal.schema';

export type GoalContributionDocument = GoalContribution & Document;

@Schema({ timestamps: true })
export class GoalContribution {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Goal', required: true })
    goalId: MongooseSchema.Types.ObjectId | Goal;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId | User;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true })
    assetType: string;

    @Prop({ default: Date.now })
    date: Date;

    @Prop()
    notes?: string;
}

export const GoalContributionSchema = SchemaFactory.createForClass(GoalContribution);
