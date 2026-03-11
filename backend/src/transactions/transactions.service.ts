import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private eventsGateway: EventsGateway
  ) { }

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      ...createTransactionDto,
      userId,
    });
    const saved = await createdTransaction.save();
    this.eventsGateway.emitToUser(userId, 'transaction_added', saved);
    return saved;
  }

  async createBulk(userId: string, createTransactionDtos: CreateTransactionDto[]): Promise<any> {
    const transactionsToInsert = createTransactionDtos.map(dto => ({
      ...dto,
      userId,
    }));
    const inserted = await this.transactionModel.insertMany(transactionsToInsert);
    this.eventsGateway.emitToUser(userId, 'transactions_bulk_added', inserted);
    return inserted;
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

    if (type && type !== 'all') filter.type = type;

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
    if (sort !== 'createdAt') {
      sortObj.createdAt = order === 'asc' ? 1 : -1;
    }

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
    this.eventsGateway.emitToUser(userId, 'transaction_updated', transaction);
    return transaction as any;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.transactionModel.deleteOne({ _id: id, userId } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Transaction not found');
    this.eventsGateway.emitToUser(userId, 'transaction_deleted', { id });
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

    const transactions = await this.transactionModel.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    } as any).sort({ date: -1 }).exec();

    const user = await this.userModel.findById(userId);

    return {
      income,
      expense,
      investment,
      portfolioValue: user?.portfolioValue || 0,
      balance: income - expense - investment,
      categoryBreakdown,
      transactions
    };
  }

  async getAnnualSummary(userId: string, year: number): Promise<any[]> {
    // Generate an array of 12 promises, one for each month
    const promises = Array.from({ length: 12 }, (_, i) => this.getSummary(userId, i + 1, year));

    // Execute all 12 aggregations concurrently for maximum performance
    const annualData = await Promise.all(promises);
    return annualData;
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

      doc.fontSize(11).text(`Total Income: Rs.${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Total Expense: Rs.${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Total Investment: Rs.${totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.fillColor(totalIncome - totalExpense - totalInvestment >= 0 ? '#10b981' : '#ef4444')
        .text(`Net Balance: Rs.${(totalIncome - totalExpense - totalInvestment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
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
        doc.fillColor(amountColor).text(`${t.type === 'expense' ? '-' : '+'}Rs.${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, y, { align: 'right' });
        doc.fillColor('#18181b');

        y += 20;
        doc.moveTo(50, y - 5).lineTo(550, y - 5).strokeColor('#f4f4f5').stroke();
      });

      doc.end();
    });
  }

  async predict(userId: string, query: string): Promise<any> {
    if (!query || query.length < 2) return null;

    // Escape regex special characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const matches = await this.transactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          description: { $regex: '^' + escapedQuery, $options: 'i' }
        }
      },
      {
        $facet: {
          categories: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ],
          amounts: [
            { $group: { _id: '$amount', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ],
          descriptions: [
            { $group: { _id: '$description', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ],
          types: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ]);

    const result = matches[0];
    return {
      category: result.categories[0]?._id || null,
      amount: result.amounts[0]?._id || null,
      description: result.descriptions[0]?._id || null,
      type: result.types[0]?._id || null
    };
  }
}
