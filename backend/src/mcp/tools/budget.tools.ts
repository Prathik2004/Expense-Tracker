import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget, BudgetDocument } from '../../schemas/budget.schema';
import { Transaction, TransactionDocument } from '../../schemas/transaction.schema';
import { Tool, ToolResult } from '../interfaces/mcp.interface';
import { MCPService } from '../mcp.service';

@Injectable()
export class BudgetTools {
  constructor(
    private readonly mcpService: MCPService,
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {
    this.mcpService.registerTool(this.getBudgets);
    this.mcpService.registerTool(this.getBudgetSpending);
  }

  getBudgets: Tool = {
    name: 'get_budgets',
    description: 'Get active budgets with spending progress',
    requiredScope: 'budget:read',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const budgets = await this.budgetModel
          .find({ userId: user.userId })
          .sort({ createdAt: -1 })
          .lean();

        const formattedBudgets = budgets.map(budget => ({
          id: budget._id.toString(),
          category: budget.category,
          monthlyLimit: Number(budget.monthlyLimit) || 0,
          month: budget.month,
          createdAt: (budget as any).createdAt,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              budgets: formattedBudgets,
              totalBudgeted: formattedBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
              count: formattedBudgets.length,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get budgets: ${error.message}`,
          }],
        };
      }
    },
  };

  getBudgetSpending: Tool = {
    name: 'get_budget_spending',
    description: 'Get spending vs budget for a specific month',
    requiredScope: 'budget:read',
    inputSchema: {
      type: 'object',
      properties: {
        month: { type: 'string', format: 'YYYY-MM' },
        category: { type: 'string' },
      },
      required: ['month'],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const query: any = { userId: user.userId };

        if (args.month) {
          query.month = args.month;
        }

        if (args.category) {
          query.category = args.category;
        }

        const budgets = await this.budgetModel.find(query).lean();

        // Calculate actual spending from transactions
        const transactionQuery: any = {
          userId: user.userId,
          type: 'expense',
        };

        if (args.month) {
          // Convert YYYY-MM to date range
          const [year, month] = args.month.split('-').map(Number);
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59);

          transactionQuery.date = {
            $gte: startDate,
            $lte: endDate,
          };
        }

        if (args.category) {
          transactionQuery.category = args.category;
        }

        const transactions = await this.transactionModel.find(transactionQuery).lean();
        const actualSpending = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              budgets: budgets.map(b => ({
                id: b._id.toString(),
                category: b.category,
                monthlyLimit: Number(b.monthlyLimit) || 0,
                month: b.month,
              })),
              actualSpending,
              budgetVsActual: budgets.map(b => ({
                category: b.category,
                budgeted: Number(b.monthlyLimit) || 0,
                spent: actualSpending,
                variance: (Number(b.monthlyLimit) || 0) - actualSpending,
                percentUsed: (Number(b.monthlyLimit) || 0) > 0
                  ? (actualSpending / (Number(b.monthlyLimit) || 1)) * 100
                  : 0,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get budget spending: ${error.message}`,
          }],
        };
      }
    },
  };
}