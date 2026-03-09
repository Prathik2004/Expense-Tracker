import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuthenticatorDocument = Authenticator & Document;

@Schema({ timestamps: true })
export class Authenticator {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    userId: string;

    @Prop({ required: true, unique: true })
    credentialID: string;

    @Prop({ required: true })
    credentialPublicKey: string; // Base64url encoded

    @Prop({ default: 0 })
    counter: number;

    @Prop({ type: [String], default: [] })
    transports: string[];

    @Prop({ default: true })
    isActive: boolean;
}

export const AuthenticatorSchema = SchemaFactory.createForClass(Authenticator);
