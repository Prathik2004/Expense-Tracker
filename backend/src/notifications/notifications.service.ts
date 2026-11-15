import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from '../schemas/push-subscription.schema';
import { NotificationPreference, NotificationPreferenceDocument } from '../schemas/notification-preference.schema';
import { NotificationLog, NotificationLogDocument } from '../schemas/notification-log.schema';
import { EventsGateway } from '../events/events.gateway';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  url: string;
  tag?: string;
  dedupeKey?: string;
  urgent?: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly configured: boolean;

  constructor(
    @InjectModel(PushSubscription.name) private readonly subscriptionModel: Model<PushSubscriptionDocument>,
    @InjectModel(NotificationPreference.name) private readonly preferenceModel: Model<NotificationPreferenceDocument>,
    @InjectModel(NotificationLog.name) private readonly logModel: Model<NotificationLogDocument>,
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
  ) {
    const publicKey = configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = configService.get<string>('VAPID_SUBJECT');
    this.configured = Boolean(publicKey && privateKey && subject);
    if (this.configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!);
    else this.logger.error('Web Push is disabled: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT are required.');
  }

  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  async subscribe(userId: string, dto: SubscribeDto, userAgent?: string) {
    return this.subscriptionModel.findOneAndUpdate(
      { endpoint: dto.endpoint },
      { userId: new Types.ObjectId(userId), keys: dto.keys, deviceLabel: dto.deviceLabel, userAgent, failureCount: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean().exec();
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionModel.deleteOne({ userId: new Types.ObjectId(userId), endpoint } as any).exec();
  }

  async listSubscriptions(userId: string) {
    return this.subscriptionModel.find({ userId: new Types.ObjectId(userId) } as any)
      .select('endpoint userAgent deviceLabel createdAt lastSuccessAt').lean().exec();
  }

  async getPreferences(userId: string) {
    return this.preferenceModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) } as any, { $setOnInsert: { userId: new Types.ObjectId(userId) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean().exec();
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const existing = await this.getPreferences(userId);
    return this.preferenceModel.findByIdAndUpdate(existing?._id, {
      $set: { ...dto, ...(dto.types ? { types: { ...existing.types, ...dto.types } } : {}), ...(dto.quietHours ? { quietHours: { ...existing.quietHours, ...dto.quietHours } } : {}) },
    }, { new: true }).lean().exec();
  }

  async list(userId: string, page = 1, limit = 20) {
    const filter = { userId: new Types.ObjectId(userId) } as any;
    const [data, total] = await Promise.all([
      this.logModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
      this.logModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(userId: string, id: string) {
    return this.logModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) } as any, { readAt: new Date() }, { new: true },
    ).lean().exec();
  }

  async markAllRead(userId: string) {
    return this.logModel.updateMany({ userId: new Types.ObjectId(userId), readAt: null } as any, { readAt: new Date() }).exec();
  }

  async send(userId: string, input: NotificationInput): Promise<void> {
    try {
      const preferences = await this.getPreferences(userId);
      const enabledForType = preferences?.types?.[input.type as keyof typeof preferences.types];
      if (!preferences?.enabled || enabledForType === false) {
        await this.writeLog(userId, input, 'skipped');
        return;
      }
      if (!input.urgent && preferences.quietHours?.enabled && this.isQuietHours(preferences.timezone, preferences.quietHours.start, preferences.quietHours.end)) {
        await this.writeLog(userId, input, 'skipped');
        return;
      }
      if (input.dedupeKey && await this.logModel.exists({ userId: new Types.ObjectId(userId), dedupeKey: input.dedupeKey, status: { $in: ['sent', 'skipped'] } } as any)) return;

      const subscriptions = await this.subscriptionModel.find({ userId: new Types.ObjectId(userId) } as any).exec();
      const payload = JSON.stringify({ title: input.title, body: input.body, url: input.url, tag: input.tag });
      if (!this.configured || subscriptions.length === 0) {
        await this.writeLog(userId, input, subscriptions.length === 0 ? 'skipped' : 'failed');
        return;
      }

      const results = await Promise.allSettled(subscriptions.map(subscription => webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        payload,
        { TTL: 24 * 60 * 60, urgency: 'normal' },
      )));
      let sent = false;
      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        const subscription = subscriptions[index];
        if (result.status === 'fulfilled') {
          sent = true;
          await this.subscriptionModel.updateOne({ _id: subscription._id }, { lastSuccessAt: new Date(), failureCount: 0 }).exec();
        } else if ([404, 410].includes((result.reason as { statusCode?: number }).statusCode || 0)) {
          await this.subscriptionModel.deleteOne({ _id: subscription._id }).exec();
        } else {
          await this.subscriptionModel.updateOne({ _id: subscription._id }, { $inc: { failureCount: 1 } }).exec();
        }
      }
      await this.writeLog(userId, input, sent ? 'sent' : 'failed');
    } catch (error) {
      this.logger.error(`Notification failed for user ${userId}`, error instanceof Error ? error.stack : String(error));
    }
  }

  async sendTest(userId: string) {
    await this.send(userId, { type: 'securityAlerts', title: 'Expensify test notification', body: 'Push notifications are working.', url: '/settings/notifications', tag: 'test' });
  }

  private async writeLog(userId: string, input: NotificationInput, status: 'sent' | 'failed' | 'skipped') {
    const log = await this.logModel.create({ ...input, userId: new Types.ObjectId(userId) as any, sentAt: new Date(), status });
    if (status === 'sent') this.eventsGateway.emitToUser(userId, 'notification-created', log);
  }

  private isQuietHours(timezone: string, start: string, end: string): boolean {
    try {
      const current = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
      const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
      const now = toMinutes(current);
      const from = toMinutes(start);
      const until = toMinutes(end);
      return from < until ? now >= from && now < until : now >= from || now < until;
    } catch {
      return false;
    }
  }
}
