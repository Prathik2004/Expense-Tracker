import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PortfolioEntry, PortfolioEntryDocument } from '../schemas/portfolio-entry.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreatePortfolioEntryDto } from './dto/create-portfolio-entry.dto';

@Injectable()
export class PortfolioService {
    constructor(
        @InjectModel(PortfolioEntry.name) private portfolioEntryModel: Model<PortfolioEntryDocument>,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }

    async createBulk(userId: string, dtos: CreatePortfolioEntryDto[]): Promise<any> {
        const entries = dtos.map(dto => ({
            ...dto,
            userId: new Types.ObjectId(userId),
        }));
        return this.portfolioEntryModel.insertMany(entries);
    }

    async getPortfolio(userId: string): Promise<any> {
        // 1. Get all-time grouped investments from Transactions (monthly salary bits)
        const transactionInvestments = await this.transactionModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId), type: 'investment' } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        // 2. Get all-time grouped entries from PortfolioEntries (manual starting balances)
        const manualEntries = await this.portfolioEntryModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        // 3. Merge them
        const categoriesMap: Record<string, number> = {};

        transactionInvestments.forEach(item => {
            const cat = item._id || 'Other';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + item.total;
        });

        manualEntries.forEach(item => {
            const cat = item._id || 'Other';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + item.total;
        });

        let totalInvestedAllTime = 0;
        const holdings = Object.entries(categoriesMap).map(([category, amount]) => {
            totalInvestedAllTime += amount;
            return { category, amount };
        });

        const user = await this.userModel.findById(userId);

        return {
            totalInvested: totalInvestedAllTime,
            portfolioValue: user?.portfolioValue || 0,
            holdings: holdings.sort((a, b) => b.amount - a.amount)
        };
    }
}
