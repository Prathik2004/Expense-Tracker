import { Model } from 'mongoose';
import { PortfolioEntryDocument } from '../schemas/portfolio-entry.schema';
import { TransactionDocument } from '../schemas/transaction.schema';
import { UserDocument } from '../schemas/user.schema';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';
export declare class PortfolioService {
    private portfolioEntryModel;
    private transactionModel;
    private userModel;
    constructor(portfolioEntryModel: Model<PortfolioEntryDocument>, transactionModel: Model<TransactionDocument>, userModel: Model<UserDocument>);
    createBulk(userId: string, dtos: CreatePortfolioEntryDto[]): Promise<any>;
    getPortfolio(userId: string): Promise<any>;
}
