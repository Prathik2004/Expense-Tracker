import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PushSubscriptionDocument = PushSubscription & Document;

@Schema({ _id: false })
export class PushSubscriptionKeys {
  @Prop({ required: true })
  p256dh: string;

  @Prop({ required: true })
  auth: string;
}

@Schema({ timestamps: true })
export class PushSubscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({ type: PushSubscriptionKeys, required: true })
  keys: PushSubscriptionKeys;

  @Prop()
  userAgent?: string;

  @Prop()
  deviceLabel?: string;

  @Prop()
  lastSuccessAt?: Date;

  @Prop({ default: 0 })
  failureCount: number;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
