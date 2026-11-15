import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async sendGoalReminders() {
    if (!this.isCronEnabled()) return;
    const now = new Date();
    const users = await this.userModel.find().select('_id').cursor();
    let count = 0;
    for await (const user of users) {
      const goals = await this.goalModel.find({ userId: user._id, completed: { $ne: true } } as any).lean().exec();
      for (const goal of goals) {
        const days = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / 86_400_000);
        if (![7, 3, 1].includes(days) && days >= 0) continue;
        const milestone = days < 0 ? 'overdue' : `${days}d`;
        await this.notificationsService.send(user._id.toString(), {
          type: 'goalReminders',
          title: days < 0 ? 'Goal overdue' : 'Goal reminder',
          body: days < 0 ? `${goal.title} is overdue` : `${goal.title} is due in ${days} day${days === 1 ? '' : 's'}`,
          url: '/goals',
          tag: `goal-${goal._id}-${milestone}`,
          dedupeKey: `goal:${goal._id}:${milestone}`,
        });
        count += 1;
      }
    }
    this.logger.log(`Goal reminder job processed ${count} notifications`);
  }

  @Cron('* * * * *')
  async sendDailyReminders() {
    if (!this.isCronEnabled()) return;
    const users = await this.userModel.find().select('_id').cursor();
    for await (const user of users) {
      const preferences = await this.notificationsService.getPreferences(user._id.toString());
      if (!preferences?.enabled || preferences.types?.dailyReminder === false) continue;
      const localTime = new Intl.DateTimeFormat('en-GB', { timeZone: preferences.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
      if (localTime !== preferences.dailyReminderTime) continue;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const hasTransaction = await this.transactionModel.exists({ userId: user._id, date: { $gte: start } } as any);
      if (!hasTransaction) {
        await this.notificationsService.send(user._id.toString(), {
          type: 'dailyReminder',
          title: 'Daily expense reminder',
          body: 'Did you log today’s expenses?',
          url: '/transactions',
          tag: `daily-${new Date().toISOString().slice(0, 10)}`,
          dedupeKey: `daily:${user._id}:${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  @Cron('0 19 * * 0', { timeZone: 'Asia/Kolkata' })
  async sendWeeklySummaries() {
    if (!this.isCronEnabled()) return;
    await this.sendSummary('weeklySummary', 'Weekly summary', 'weekly');
  }

  @Cron('0 9 1 * *', { timeZone: 'Asia/Kolkata' })
  async sendMonthlySummaries() {
    if (!this.isCronEnabled()) return;
    await this.sendSummary('monthlySummary', 'Monthly summary', 'monthly');
  }

  private async sendSummary(type: 'weeklySummary' | 'monthlySummary', title: string, period: string) {
    const now = new Date();
    const start = period === 'weekly'
      ? new Date(now.getTime() - 7 * 86_400_000)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = period === 'weekly' ? now : new Date(now.getFullYear(), now.getMonth(), 1);
    const users = await this.userModel.find().select('_id').cursor();
    for await (const user of users) {
      const preferences = await this.notificationsService.getPreferences(user._id.toString());
      if (!preferences?.enabled || preferences.types?.[type] === false) continue;
      const summary = await this.transactionModel.aggregate([
        { $match: { userId: user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]);
      const income = summary.find((item) => item._id === 'income')?.total || 0;
      const expense = summary.find((item) => item._id === 'expense')?.total || 0;
      await this.notificationsService.send(user._id.toString(), {
        type,
        title,
        body: preferences.hideAmounts
          ? 'Your latest income and expense summary is ready.'
          : `Income ₹${income.toLocaleString('en-IN')} · Expense ₹${expense.toLocaleString('en-IN')}`,
        url: '/reports',
        tag: `${period}-summary`,
        dedupeKey: `${period}:${user._id}:${new Date().toISOString().slice(0, 7)}`,
      });
    }
  }

  private isCronEnabled() {
    return process.env.RUN_CRON === 'true';
  }
}
