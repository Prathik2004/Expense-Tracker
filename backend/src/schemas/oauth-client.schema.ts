import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OAuthClientDocument = OAuthClient & Document;

@Schema({ timestamps: true })
export class OAuthClient {
  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  redirectUris: string[];

  @Prop({ type: [String], default: ['mcp:full_read'] })
  scopes: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  expiresAt?: Date;
}

export const OAuthClientSchema = SchemaFactory.createForClass(OAuthClient);

// Create indexes
OAuthClientSchema.index({ clientId: 1 }, { unique: true });
OAuthClientSchema.index({ userId: 1 });