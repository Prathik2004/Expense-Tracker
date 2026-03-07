import { Model } from 'mongoose';
import { TransactionDocument } from '../schemas/transaction.schema';
export declare class RecurringService {
    private transactionModel;
    private readonly logger;
    constructor(transactionModel: Model<TransactionDocument>);
    handleRecurringTransactions(): Promise<void>;
}
