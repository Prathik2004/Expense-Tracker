import { Model } from 'mongoose';
import { TransactionDocument } from '../schemas/transaction.schema';
import { UserDocument } from '../schemas/user.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
export declare class TransactionsService {
    private transactionModel;
    private userModel;
    constructor(transactionModel: Model<TransactionDocument>, userModel: Model<UserDocument>);
    create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument>;
    createBulk(userId: string, createTransactionDtos: CreateTransactionDto[]): Promise<any>;
    findAll(userId: string, query: any): Promise<{
        data: TransactionDocument[];
        total: number;
    }>;
    findOne(userId: string, id: string): Promise<TransactionDocument>;
    update(userId: string, id: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDocument>;
    remove(userId: string, id: string): Promise<void>;
    getSummary(userId: string, month: number, year: number): Promise<any>;
}
