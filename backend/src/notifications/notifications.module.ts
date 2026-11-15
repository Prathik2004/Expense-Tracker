import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventsModule } from '../events/events.module';
import { User, UserSchema } from '../schemas/user.schema';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { PushSubscription, PushSubscriptionSchema } from '../schemas/push-subscription.schema';
import { NotificationPreference, NotificationPreferenceSchema } from '../schemas/notification-preference.schema';
import { NotificationLog, NotificationLogSchema } from '../schemas/notification-log.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 20 }]),
    EventsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
      { name: NotificationPreference.name, schema: NotificationPreferenceSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
