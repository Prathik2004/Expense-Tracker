import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    ) { }

    async processUpiSms(payload: { sender: string; message: string; userId: string }) {
        const { message, userId } = payload;

        // 1. Check if it's a debit message
        // regex matches 'debited', 'spent', 'sent', 'paid to'
        const isDebit = /debited|spent|sent|paid to/i.test(message);
        if (!isDebit) {
            this.logger.log('Ignoring non-debit message or OTP');
            return { success: false, reason: 'Not a debit message' };
        }

        // 2. Extract Amount
        // Matches: Rs. 500, Rs.500.00, INR 500, Rs 500
        const amountRegex = /(?:Rs\.?|INR|Rs)\s?([\d,]+\.?\d*)/i;
        const amountMatch = message.match(amountRegex);
        if (!amountMatch) {
            this.logger.warn('Could not extract amount from message');
            return { success: false, reason: 'Amount not found' };
        }
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

        // 3. Extract Merchant/Receiver
        // Matches: to VPA merchant@upi, to [Name], paid to [Name]
        const merchantRegex = /(?:to VPA|to|paid to|transfer to)\s+([^.]+)/i;
        const merchantMatch = message.match(merchantRegex);
        const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';

        // 4. Save to Database
        const transaction = new this.transactionModel({
            userId: new Types.ObjectId(userId),
            type: 'expense',
            amount,
            category: 'Auto-Logged',
            description: `Auto-Logged from SMS: ${merchant}`,
            date: new Date(),
            source: 'auto-sms',
        });

        await transaction.save();

        this.logger.log(`Successfully auto-logged expense: ${amount} to ${merchant}`);
        return { success: true, transactionId: transaction._id };
    }
}
