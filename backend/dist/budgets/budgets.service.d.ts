import { Model } from 'mongoose';
import { BudgetDocument } from '../schemas/budget.schema';
import { TransactionDocument } from '../schemas/transaction.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
export declare class BudgetsService {
    private budgetModel;
    private transactionModel;
    constructor(budgetModel: Model<BudgetDocument>, transactionModel: Model<TransactionDocument>);
    create(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetDocument>;
    findAll(userId: string, month?: string): Promise<any[]>;
    findOne(userId: string, id: string): Promise<BudgetDocument>;
    update(userId: string, id: string, updateBudgetDto: UpdateBudgetDto): Promise<BudgetDocument>;
    remove(userId: string, id: string): Promise<void>;
}
