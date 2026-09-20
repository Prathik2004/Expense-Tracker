import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { Tool, ToolResult } from '../interfaces/mcp.interface';
import { MCPService } from '../mcp.service';

@Injectable()
export class TransactionTools {
  constructor(
    private readonly mcpService: MCPService,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {
    this.mcpService.registerTool(this.getTransactions);
    this.mcpService.registerTool(this.getTransactionStats);
  }

  getTransactions: Tool = {
    name: 'get_transactions',
    description: 'Get filtered transaction history with pagination',
    requiredScope: 'transaction:read',
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: { type: 'string', format: 'date' },
        toDate: { type: 'string', format: 'date' },
        category: { type: 'string' },
        type: { type: 'string', enum: ['income', 'expense', 'transfer'] },
        minAmount: { type: 'number', minimum: 0 },
        maxAmount: { type: 'number', minimum: 0 },
        offset: { type: 'number', minimum: 0, default: 0 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      },
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const query: any = { userId: new Types.ObjectId(user.userId) };

        if (args.fromDate && args.toDate) {
          query.date = {
            $gte: new Date(args.fromDate),
            $lte: new Date(args.toDate),
          };
        }

        if (args.category) query.category = args.category;
        if (args.type) query.type = args.type;

        if (args.minAmount !== undefined || args.maxAmount !== undefined) {
          query.amount = {};
          if (args.minAmount !== undefined) query.amount.$gte = args.minAmount;
          if (args.maxAmount !== undefined) query.amount.$lte = args.maxAmount;
        }

        const offset = args.offset || 0;
        const limit = Math.min(args.limit || 20, 100);

        const [transactions, total] = await Promise.all([
          this.transactionModel
            .find(query)
            .sort({ date: -1 })
            .skip(offset)
            .limit(limit)
            .lean(),
          this.transactionModel.countDocuments(query),
        ]);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              transactions: transactions.map(t => ({
                id: t._id.toString(),
                date: t.date,
                description: t.description,
                amount: Number(t.amount) || 0,
                category: t.category,
                type: t.type,
                paymentMethod: t.paymentMethod,
              })),
              pagination: {
                offset,
                limit,
                total,
                hasMore: offset + limit < total,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get transactions: ${error.message}`,
          }],
        };
      }
    },
  };

  getTransactionStats: Tool = {
    name: 'get_transaction_stats',
    description: 'Get income/expense breakdown by period',
    requiredScope: 'transaction:read',
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: { type: 'string', format: 'date' },
        toDate: { type: 'string', format: 'date' },
      },
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const query: any = { userId: new Types.ObjectId(user.userId) };

        if (args.fromDate && args.toDate) {
          query.date = {
            $gte: new Date(args.fromDate),
            $lte: new Date(args.toDate),
          };
        }

        const stats = await this.transactionModel.aggregate([
          { $match: query },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' },
            },
          },
        ]);

        const categoryBreakdown = await this.transactionModel.aggregate([
          { $match: { ...query, type: 'expense' } },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              overview: stats,
              categoryBreakdown,
              period: {
                from: args.fromDate || 'beginning',
                to: args.toDate || 'now',
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get transaction stats: ${error.message}`,
          }],
        };
      }
    },
  };
}