import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) { }

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      userId,
    });
    return createdTransaction.save();
  }

  async createBulk(userId: string, createTransactionDtos: CreateTransactionDto[]): Promise<any> {
    const transactionsToInsert = createTransactionDtos.map(dto => ({
      ...dto,
      userId,
    }));
    return this.transactionModel.insertMany(transactionsToInsert);
  }

  async findAll(userId: string, query: any): Promise<{ data: TransactionDocument[], total: number }> {
    const { page = 1, limit = 10, type, category, startDate, endDate, sort = 'date', order = 'desc' } = query;
    const filter: any = { userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sortObj: any = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.transactionModel.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).exec(),
      this.transactionModel.countDocuments(filter).exec()
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findOne({ _id: id, userId } as any).exec();
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async update(userId: string, id: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findOneAndUpdate(
      { _id: id, userId } as any,
      updateTransactionDto,
      { new: true }
    ).exec();
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction as any;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.transactionModel.deleteOne({ _id: id, userId } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Transaction not found');
  }

  async getSummary(userId: string, month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const summary = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;
    const investment = summary.find(s => s._id === 'investment')?.total || 0;

    const categoryBreakdown = await this.transactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const user = await this.userModel.findById(userId);

    return {
      income,
      expense,
      investment,
      portfolioValue: user?.portfolioValue || 0,
      balance: income - expense - investment,
      categoryBreakdown
    };
  }
}

