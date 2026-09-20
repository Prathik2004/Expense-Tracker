import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investment, InvestmentDocument } from '../../schemas/investment.schema';
import { Tool, ToolResult } from '../interfaces/mcp.interface';
import { MCPService } from '../mcp.service';

@Injectable()
export class InvestmentTools {
  constructor(
    private readonly mcpService: MCPService,
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
  ) {
    this.mcpService.registerTool(this.getInvestmentPerformance);
    this.mcpService.registerTool(this.getAssetAllocation);
  }

  getInvestmentPerformance: Tool = {
    name: 'get_investment_performance',
    description: 'Get investment performance metrics including returns and allocations',
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

        const totalInvested = investments.reduce((sum, i) => sum + (Number(i.investedAmount) || 0), 0);
        const totalValue = investments.reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);
        const totalGainLoss = totalValue - totalInvested;

        const performance = investments.map(inv => {
          const invested = Number(inv.investedAmount) || 0;
          const current = Number(inv.currentValue) || 0;
          const gainLoss = current - invested;
          const returnPct = invested > 0 ? (gainLoss / invested) * 100 : 0;

          return {
            name: inv.name,
            assetType: inv.assetType,
            invested,
            currentValue: current,
            gainLoss,
            returnPercentage: Number(returnPct.toFixed(2)),
          };
        }).sort((a, b) => b.returnPercentage - a.returnPercentage);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              overall: {
                totalInvested,
                totalValue,
                totalGainLoss,
                overallReturn: totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100).toFixed(2) : 0,
              },
              investments: performance,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get investment performance: ${error.message}`,
          }],
        };
      }
    },
  };

  getAssetAllocation: Tool = {
    name: 'get_asset_allocation',
    description: 'Get asset allocation breakdown by type',
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

        const totalValue = investments.reduce((sum, i) => sum + (Number(i.currentValue) || 0), 0);

        const allocationByType: Record<string, { value: number; count: number }> = {};

        for (const inv of investments) {
          const type = inv.assetType || 'Other';
          const value = Number(inv.currentValue) || 0;

          if (!allocationByType[type]) {
            allocationByType[type] = { value: 0, count: 0 };
          }

          allocationByType[type].value += value;
          allocationByType[type].count += 1;
        }

        const allocation = Object.entries(allocationByType).map(([type, data]) => ({
          assetType: type,
          value: data.value,
          count: data.count,
          percentage: totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(2) : 0,
        })).sort((a, b) => b.value - a.value);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              allocation,
              totalValue,
              assetTypes: allocation.length,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get asset allocation: ${error.message}`,
          }],
        };
      }
    },
  };
}