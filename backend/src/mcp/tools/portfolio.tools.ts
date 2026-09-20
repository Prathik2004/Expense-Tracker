import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PortfolioHolding, PortfolioHoldingDocument } from '../../schemas/portfolio-holding.schema';
import { PortfolioSnapshot, PortfolioSnapshotDocument } from '../../schemas/portfolio-snapshot.schema';
import { Investment, InvestmentDocument } from '../../schemas/investment.schema';
import { Tool, ToolResult } from '../interfaces/mcp.interface';
import { MCPService } from '../mcp.service';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class PortfolioTools {
  constructor(
    private readonly mcpService: MCPService,
    @InjectModel('PortfolioHolding') private portfolioHoldingModel: Model<PortfolioHoldingDocument>,
    @InjectModel('PortfolioSnapshot') private portfolioSnapshotModel: Model<PortfolioSnapshotDocument>,
    @InjectModel('Investment') private investmentModel: Model<InvestmentDocument>,
  ) {
    // Register tools
    this.mcpService.registerTool(this.getPortfolioSummary);
    this.mcpService.registerTool(this.getHoldings);
    this.mcpService.registerTool(this.getInvestments);
    this.mcpService.registerTool(this.getPortfolioHistory);
  }

  // Tool: Get Portfolio Summary
  getPortfolioSummary: Tool = {
    name: 'get_portfolio_summary',
    description: 'Get portfolio summary including total value, gain/loss, and allocations',
    requiredScope: 'portfolio:read',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        // Get portfolio holdings
        const holdings = await this.portfolioHoldingModel
          .find({ userId: new Types.ObjectId(user.userId) })
          .sort({ updatedAt: -1 })
          .lean();

        // Get investments from external providers
        const investments = await this.investmentModel
          .find({ userId: new Types.ObjectId(user.userId) })
          .lean();

        // Calculate totals
        const totalHoldingsValue = holdings.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
        const totalInvestmentsValue = investments.reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);
        const totalInvestedAmount = investments.reduce((sum, i) => sum + (Number(i.investedAmount) || 0), 0);

        const totalValue = totalHoldingsValue + totalInvestmentsValue;
        const gainLoss = totalValue - totalInvestedAmount;
        const gainLossPercentage = totalInvestedAmount > 0 ? (gainLoss / totalInvestedAmount) * 100 : 0;

        // Group holdings by category
        const allocations: Record<string, number> = {};
        for (const holding of holdings) {
          const category = holding.category || 'Other';
          allocations[category] = (allocations[category] || 0) + (Number(holding.amount) || 0);
        }

        for (const investment of investments) {
          const category = investment.assetType || 'Investment';
          allocations[category] = (allocations[category] || 0) + (Number(investment.currentValue) || 0);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              totalValue,
              totalInvested: totalInvestedAmount,
              gainLoss,
              gainLossPercentage: Number(gainLossPercentage.toFixed(2)),
              allocations,
              holdingsCount: holdings.length,
              investmentsCount: investments.length,
              lastUpdated: new Date().toISOString(),
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get portfolio summary: ${error.message}`,
          }],
        };
      }
    },
  };

  // Tool: Get Holdings
  getHoldings: Tool = {
    name: 'get_holdings',
    description: 'Get current holdings by category with values',
    requiredScope: 'portfolio:read',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const holdings = await this.portfolioHoldingModel
          .find({ userId: new Types.ObjectId(user.userId) })
          .sort({ updatedAt: -1 })
          .lean();

        // Get unique holdings by category (latest first)
        const holdingsByCategory = new Map<string, any>();
        for (const holding of holdings) {
          if (!holdingsByCategory.has(holding.category)) {
            holdingsByCategory.set(holding.category, {
              category: holding.category,
              amount: Number(holding.amount) || 0,
              source: holding.source,
              date: holding.date,
              syncedAt: holding.syncedAt,
            });
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              holdings: Array.from(holdingsByCategory.values()),
              totalHoldings: holdingsByCategory.size,
              totalValue: Array.from(holdingsByCategory.values()).reduce((sum, h) => sum + h.amount, 0),
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get holdings: ${error.message}`,
          }],
        };
      }
    },
  };

  // Tool: Get Investments
  getInvestments: Tool = {
    name: 'get_investments',
    description: 'Get connected investments (INDmoney) with performance metrics',
    requiredScope: 'investments:read',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const investments = await this.investmentModel
          .find({ userId: new Types.ObjectId(user.userId) })
          .lean();

        const formattedInvestments = investments.map(inv => ({
          id: inv._id.toString(),
          name: inv.name,
          symbol: inv.symbol,
          isin: inv.isin,
          assetType: inv.assetType,
          quantity: Number(inv.quantity) || 0,
          investedAmount: Number(inv.investedAmount) || 0,
          currentValue: Number(inv.currentValue) || 0,
          currency: inv.currency || 'INR',
          gainLoss: (Number(inv.currentValue) || 0) - (Number(inv.investedAmount) || 0),
          gainLossPercentage: (Number(inv.investedAmount) || 0) > 0
            ? Number((((Number(inv.currentValue) || 0) - (Number(inv.investedAmount) || 0)) / (Number(inv.investedAmount) || 1)) * 100).toFixed(2)
            : 0,
          lastSyncedAt: inv.lastSyncedAt,
        }));

        const totalInvested = formattedInvestments.reduce((sum, i) => sum + i.investedAmount, 0);
        const totalValue = formattedInvestments.reduce((sum, i) => sum + i.currentValue, 0);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              investments: formattedInvestments,
              summary: {
                totalInvested,
                totalValue,
                totalGainLoss: totalValue - totalInvested,
                totalGainLossPercentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
                count: formattedInvestments.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get investments: ${error.message}`,
          }],
        };
      }
    },
  };

  // Tool: Get Portfolio History
  getPortfolioHistory: Tool = {
    name: 'get_portfolio_history',
    description: 'Get historical portfolio snapshots with pagination',
    requiredScope: 'portfolio:read',
    inputSchema: {
      type: 'object',
      properties: {
        offset: { type: 'number', minimum: 0, default: 0 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      },
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const offset = args.offset || 0;
        const limit = Math.min(args.limit || 20, 100);

        const snapshots = await this.portfolioSnapshotModel
          .find({ userId: new Types.ObjectId(user.userId) })
          .sort({ capturedAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean();

        const total = await this.portfolioSnapshotModel
          .countDocuments({ userId: new Types.ObjectId(user.userId) });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              snapshots: snapshots.map(s => ({
                id: s._id.toString(),
                capturedAt: s.capturedAt,
                currentValue: Number(s.currentValue) || 0,
                investedAmount: Number(s.investedAmount) || 0,
                source: s.source,
                allocation: s.allocation,
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
            text: `Failed to get portfolio history: ${error.message}`,
          }],
        };
      }
    },
  };
}