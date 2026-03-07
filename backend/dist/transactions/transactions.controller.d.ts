import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(req: any, createTransactionDto: CreateTransactionDto): Promise<import("../schemas/transaction.schema").TransactionDocument>;
    getSummary(req: any, month: string, year: string): Promise<any>;
    exportCsv(req: any, res: Response): Promise<void>;
    findAll(req: any, query: any): Promise<{
        data: import("../schemas/transaction.schema").TransactionDocument[];
        total: number;
    }>;
    findOne(req: any, id: string): Promise<import("../schemas/transaction.schema").TransactionDocument>;
    update(req: any, id: string, updateTransactionDto: UpdateTransactionDto): Promise<import("../schemas/transaction.schema").TransactionDocument>;
    remove(req: any, id: string): Promise<void>;
}
