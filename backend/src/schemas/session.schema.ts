import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: string;

    @Prop({ required: true, unique: true })
    sessionId: string;

    @Prop()
    ip?: string;

    @Prop()
    userAgent?: string;

    @Prop()
    deviceType?: string; // mobile, desktop, tablet, unknown

    @Prop({ default: Date.now })
    lastActive: Date;

    @Prop({ default: true })
    isValid: boolean;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
