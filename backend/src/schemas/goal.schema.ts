import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type GoalDocument = Goal & Document;

@Schema({ timestamps: true })
export class Goal {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId | User;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true, min: 0 })
    targetAmount: number;

    @Prop({ default: 0, min: 0 })
    currentAmount: number;

    @Prop({ required: true })
    deadline: Date;

    @Prop()
    category?: string;

    @Prop()
    icon?: string;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
