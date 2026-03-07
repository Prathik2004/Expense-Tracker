import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../schemas/budget.schema';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) { }

  async create(userId: string, createBudgetDto: CreateBudgetDto): Promise<BudgetDocument> {
    const existing = await this.budgetModel.findOne({
      userId: userId as any,
      category: createBudgetDto.category,
      month: createBudgetDto.month
    });

    if (existing) {
      existing.monthlyLimit = createBudgetDto.monthlyLimit;
      return existing.save();
    }

    const createdBudget = new this.budgetModel({
      ...createBudgetDto,
      userId,
    });
    return createdBudget.save();
  }

  async findAll(userId: string, month?: string): Promise<any[]> {
    const query: any = { userId };
    if (month) query.month = month;

    const budgets = await this.budgetModel.find(query).exec();

    // Calculate spent amount for each budget
    return Promise.all(budgets.map(async (budget) => {
      // month string is YYYY-MM
      const [yearStr, monthStr] = budget.month.split('-');
      const year = parseInt(yearStr);
      const m = parseInt(monthStr);

      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59, 999);

      const spentAgg = await this.transactionModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            type: 'expense',
            category: budget.category,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const spent = spentAgg.length > 0 ? spentAgg[0].total : 0;

      return {
        ...budget.toObject(),
        spent
      };
    }));
  }

  async findOne(userId: string, id: string): Promise<BudgetDocument> {
    const budget = await this.budgetModel.findOne({ _id: id, userId } as any).exec();
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async update(userId: string, id: string, updateBudgetDto: UpdateBudgetDto): Promise<BudgetDocument> {
    const budget = await this.budgetModel.findOneAndUpdate(
      { _id: id, userId } as any,
      updateBudgetDto,
      { new: true }
    ).exec();
    if (!budget) throw new NotFoundException('Budget not found');
    return budget as any;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.budgetModel.deleteOne({ _id: id, userId } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Budget not found');
  }
}
