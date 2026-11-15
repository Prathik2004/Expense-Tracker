import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RecurringService {
    private readonly logger = new Logger(RecurringService.name);

    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleRecurringTransactions() {
        this.logger.debug('Running daily recurring transactions check');

        const today = new Date();
        const currentDay = today.getDate();

        // Find all recurring transactions where recurringDay matches today
        const recurringTemplates = await this.transactionModel.find({
            isRecurring: true,
            recurringDay: currentDay,
            userId: { $exists: true },
        }).exec();

        this.logger.debug(`Found ${recurringTemplates.length} recurring templates for day ${currentDay}`);

        for (const template of recurringTemplates) {
            // Check if we already created a transaction for this template this month
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

            const alreadyProcessed = await this.transactionModel.exists({
            userId: template.userId as any,
            recurringTemplateId: template._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            } as any);

            if (!alreadyProcessed) {
                const newTx = new this.transactionModel({
                    userId: template.userId,
                    type: template.type,
                    amount: template.amount,
                    category: template.category,
                    description: `Auto-generated: ${template.description || 'Recurring transaction'}`,
                    date: new Date(),
                    isRecurring: false, // The newly generated instance shouldn't trigger future ones itself
                    recurringTemplateId: template._id,
                });

                await newTx.save();
                this.logger.debug(`Generated new transaction for user ${(template.userId as any).toString()}`);
                void this.notificationsService.send((template.userId as any).toString(), {
                    type: 'recurringAdded',
                    title: 'Recurring transaction added',
                    body: `Recurring ${template.description || 'transaction'} was added`,
                    url: '/transactions',
                    tag: `recurring-${template._id}`,
                    dedupeKey: `recurring:${template._id}:${today.getFullYear()}-${today.getMonth() + 1}`,
                });
            }
        }
    }
}
