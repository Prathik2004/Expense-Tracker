import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
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
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sort = 'date',
      order = 'desc'
    } = query;
    const filter: any = { userId };

    if (type) filter.type = type;

    if (category) {
      const categories = category.split(',');
      if (categories.length > 1) {
        filter.category = { $in: categories };
      } else {
        filter.category = categories[0];
      }
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
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

  async generatePdfReport(userId: string, data: TransactionDocument[]): Promise<Buffer> {
    const user = await this.userModel.findById(userId);
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fillColor('#18181b').fontSize(24).text('Financial Report', { align: 'center' });
      doc.fontSize(10).fillColor('#71717a').text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, { align: 'center' });
      doc.moveDown(2);

      // User Info
      doc.fillColor('#18181b').fontSize(12).text(`User: ${user?.name || 'Unknown User'}`);
      doc.text(`Email: ${user?.email || 'N/A'}`);
      doc.moveDown(1.5);

      // Summary
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown(0.5);

      const totalIncome = data.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = data.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const totalInvestment = data.filter(t => t.type === 'investment').reduce((acc, t) => acc + t.amount, 0);

      doc.fontSize(11).text(`Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Total Expense: ₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Total Investment: ₹${totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.fillColor(totalIncome - totalExpense - totalInvestment >= 0 ? '#10b981' : '#ef4444')
        .text(`Net Balance: ₹${(totalIncome - totalExpense - totalInvestment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.moveDown(2);

      // Transactions Table
      doc.fillColor('#18181b').fontSize(16).text('Transactions', { underline: true });
      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', 50, tableTop);
      doc.text('Description', 130, tableTop);
      doc.text('Category', 280, tableTop);
      doc.text('Type', 380, tableTop);
      doc.text('Amount', 480, tableTop, { align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e4e4e7').stroke();
      doc.moveDown(1);

      // Table Body
      let y = tableTop + 25;
      doc.font('Helvetica');

      data.forEach((t, i) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.fontSize(9).text(format(new Date(t.date), 'MMM dd, yyyy'), 50, y);
        doc.text(t.description || '-', 130, y, { width: 140, height: 12, ellipsis: true });
        doc.text(t.category, 280, y);
        doc.text(t.type, 380, y);

        const amountColor = t.type === 'income' ? '#10b981' : t.type === 'expense' ? '#18181b' : '#8b5cf6';
        doc.fillColor(amountColor).text(`${t.type === 'expense' ? '-' : '+'}₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, y, { align: 'right' });
        doc.fillColor('#18181b');

        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).strokeColor('#f4f4f5').stroke();
      });

      doc.end();
    });
  }
}

