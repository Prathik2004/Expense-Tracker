import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IndmoneyStateDocument = IndmoneyState & Document;

@Schema({ timestamps: true })
export class IndmoneyState {
  @Prop({ required: true })
  state: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  codeVerifier: string;

  @Prop({ required: true })
  codeChallenge: string;

  @Prop()
  expiresAt: Date;
}

export const IndmoneyStateSchema = SchemaFactory.createForClass(IndmoneyState);
IndmoneyStateSchema.index({ state: 1 }, { unique: true });
