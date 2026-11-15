import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationLogDocument = NotificationLog & Document;

@Schema({ timestamps: true })
export class NotificationLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) body: string;
  @Prop({ required: true }) url: string;
  @Prop() image?: string;
  @Prop() tag?: string;
  @Prop({ required: true }) sentAt: Date;
  @Prop() readAt?: Date;
  @Prop({ required: true, enum: ['sent', 'failed', 'skipped'] }) status: string;
  @Prop({ index: true }) dedupeKey?: string;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);
NotificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
NotificationLogSchema.index({ userId: 1, createdAt: -1 });
