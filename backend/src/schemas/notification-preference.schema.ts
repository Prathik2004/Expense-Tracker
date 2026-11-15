import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ _id: false })
export class NotificationTypes {
  @Prop({ default: true }) budgetAlerts: boolean;
  @Prop({ default: true }) goalReminders: boolean;
  @Prop({ default: true }) recurringAdded: boolean;
  @Prop({ default: true }) weeklySummary: boolean;
  @Prop({ default: true }) monthlySummary: boolean;
  @Prop({ default: true }) lendingReminders: boolean;
  @Prop({ default: true }) securityAlerts: boolean;
  @Prop({ default: true }) dailyReminder: boolean;
}

@Schema({ _id: false })
export class QuietHours {
  @Prop({ default: true }) enabled: boolean;
  @Prop({ default: '22:00' }) start: string;
  @Prop({ default: '08:00' }) end: string;
}

@Schema({ _id: false })
export class NotificationMessage {
  @Prop() title?: string;
  @Prop() body?: string;
}

@Schema({ _id: false })
export class CustomNotificationMessages {
  @Prop({ type: NotificationMessage, default: () => ({}) }) budgetAlerts: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) goalReminders: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) recurringAdded: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) weeklySummary: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) monthlySummary: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) lendingReminders: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) securityAlerts: NotificationMessage;
  @Prop({ type: NotificationMessage, default: () => ({}) }) dailyReminder: NotificationMessage;
}

@Schema({ timestamps: true })
export class NotificationPreference {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ default: true }) enabled: boolean;
  @Prop({ type: NotificationTypes, default: () => ({}) }) types: NotificationTypes;
  @Prop({ type: QuietHours, default: () => ({}) }) quietHours: QuietHours;
  @Prop({ type: CustomNotificationMessages, default: () => ({}) }) customMessages: CustomNotificationMessages;
  @Prop({ default: 'Asia/Kolkata' }) timezone: string;
  @Prop({ default: '20:00' }) dailyReminderTime: string;
  @Prop({ default: true }) hideAmounts: boolean;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(NotificationPreference);
