import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema.js';
import { User, UserDocument } from '../schemas/user.schema.js';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async processUpiSms(payload: { sender: string; message: string; userId: string }) {
        const { message, userId, sender } = payload;
        this.logger.log(`Processing webhook from ${sender}`);
        console.log(`[DEBUG] Received Payload:`, payload);

        // 1. Validate User
        if (!Types.ObjectId.isValid(userId)) {
            this.logger.error(`Invalid User ID format: ${userId}`);
            return { success: false, reason: 'Invalid User ID format' };
        }

        const userExists = await this.userModel.findById(userId);
        if (!userExists) {
            this.logger.error(`User not found in database: ${userId}`);
            return { success: false, reason: 'User not found' };
        }
        this.logger.log(`Verified user: ${userExists.email}`);

        // 2. Check if it's a debit message
        const isDebit = /debited|spent|sent|paid to/i.test(message);
        if (!isDebit) {
            this.logger.log('Ignoring non-debit message or OTP');
            return { success: false, reason: 'Not a debit message' };
        }

        // 3. Extract Amount
        const amountRegex = /(?:Rs\.?|INR|Rs)\s?([\d,]+\.?\d*)/i;
        const amountMatch = message.match(amountRegex);
        if (!amountMatch) {
            this.logger.warn('Could not extract amount from message');
            return { success: false, reason: 'Amount not found' };
        }
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        this.logger.log(`Parsed Amount: ${amount}`);

        // 4. Extract Merchant/Receiver
        const merchantRegex = /(?:to VPA|to|paid to|transfer to)\s+([^.]+)/i;
        const merchantMatch = message.match(merchantRegex);
        const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';
        this.logger.log(`Parsed Merchant: ${merchant}`);

        // 5. Save to Database
        try {
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
            const savedTransaction = await this.transactionModel.findById(transaction._id).exec();
            this.logger.log(`Successfully auto-logged expense: ${amount} to ${merchant}. ID: ${transaction._id}`);
            return { success: true, transaction: savedTransaction };
        } catch (error) {
            this.logger.error(`Failed to save transaction: ${error.message}`);
            return { success: false, reason: 'Database save failed', error: error.message };
        }
    }
}
