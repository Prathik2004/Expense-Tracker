import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal, GoalDocument } from '../../schemas/goal.schema';
import { GoalContribution, GoalContributionDocument } from '../../schemas/goal-contribution.schema';
import { Tool, ToolResult } from '../interfaces/mcp.interface';
import { MCPService } from '../mcp.service';

@Injectable()
export class GoalsTools {
  constructor(
    private readonly mcpService: MCPService,
    @InjectModel(Goal.name) private goalModel: Model<GoalDocument>,
    @InjectModel(GoalContribution.name) private goalContributionModel: Model<GoalContributionDocument>,
  ) {
    this.mcpService.registerTool(this.getGoals);
    this.mcpService.registerTool(this.getGoalContributions);
  }

  getGoals: Tool = {
    name: 'get_goals',
    description: 'Get active savings goals with progress',
    requiredScope: 'goals:read',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const goals = await this.goalModel
          .find({ userId: user.userId })
          .sort({ createdAt: -1 })
          .lean();

        const formattedGoals = goals.map(goal => ({
          id: goal._id.toString(),
          title: goal.title,
          targetAmount: Number(goal.targetAmount) || 0,
          currentAmount: Number(goal.currentAmount) || 0,
          remaining: Math.max(0, (Number(goal.targetAmount) || 0) - (Number(goal.currentAmount) || 0)),
          percentComplete: (Number(goal.targetAmount) || 0) > 0
            ? ((Number(goal.currentAmount) || 0) / (Number(goal.targetAmount) || 1)) * 100
            : 0,
          deadline: goal.deadline,
          category: goal.category,
          icon: goal.icon,
          createdAt: (goal as any).createdAt,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              goals: formattedGoals,
              summary: {
                totalTarget: formattedGoals.reduce((sum, g) => sum + g.targetAmount, 0),
                totalSaved: formattedGoals.reduce((sum, g) => sum + g.currentAmount, 0),
                goalsCount: formattedGoals.length,
              },
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Failed to get goals: ${error.message}`,
          }],
        };
      }
    },
  };

  getGoalContributions: Tool = {
    name: 'get_goal_contributions',
    description: 'Get contribution history for savings goals',
    requiredScope: 'goals:read',
    inputSchema: {
      type: 'object',
      properties: {
        goalId: { type: 'string' },
        offset: { type: 'number', minimum: 0, default: 0 },
        limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      },
      required: [],
    },
    handler: async (args: any, user: any): Promise<ToolResult> => {
      try {
        const query: any = { userId: user.userId };

        if (args.goalId) {
          query.goalId = args.goalId;
        }

        const offset = args.offset || 0;
        const limit = Math.min(args.limit || 20, 100);

        const [contributions, total] = await Promise.all([
          this.goalContributionModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean(),
          this.goalContributionModel.countDocuments(query),
        ]);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              contributions: contributions.map(c => ({
                id: c._id.toString(),
                goalId: c.goalId.toString(),
                amount: Number(c.amount) || 0,
                assetType: c.assetType,
                date: c.date || (c as any).createdAt,
                notes: c.notes,
              })),
              totalContributed: contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
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
            text: `Failed to get goal contributions: ${error.message}`,
          }],
        };
      }
    },
  };
}