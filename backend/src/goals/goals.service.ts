import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import { GoalContribution, GoalContributionDocument } from '../schemas/goal-contribution.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { LiquidFundsService } from '../liquid-funds/liquid-funds.service';

export interface GoalWithAllocation {
  _id: string;
  userId: string;
  title: string;
  targetAmount: number;
  bucket: string;
  deadline: Date;
  category?: string;
  icon?: string;
  allocatedAmount: number;
  stillRequired: number;
  progress: number | null;
  status: string;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal.name) private goalModel: Model<GoalDocument>,
    @InjectModel(GoalContribution.name) private contributionModel: Model<GoalContributionDocument>,
    @Inject(forwardRef(() => LiquidFundsService)) private liquidFundsService: LiquidFundsService,
  ) { }

  async create(userId: string, createGoalDto: CreateGoalDto): Promise<GoalWithAllocation> {
    const createdGoal = new this.goalModel({
      ...createGoalDto,
      userId: new Types.ObjectId(userId),
    });
    const savedGoal = await createdGoal.save();
    return this.getGoalWithAllocation(userId, savedGoal._id.toString());
  }

  async findAll(userId: string): Promise<GoalWithAllocation[]> {
    return this.getGoalsWithAllocations(userId);
  }

  async findOne(userId: string, id: string): Promise<GoalWithAllocation> {
    return this.getGoalWithAllocation(userId, id);
  }

  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto): Promise<GoalWithAllocation> {
    const goal = await this.goalModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any,
      updateGoalDto,
      { new: true }
    ).lean().exec();
    if (!goal) throw new NotFoundException('Goal not found');
    const allocation = await this.liquidFundsService.getGoalAllocationDetails(userId, id);
    return {
      _id: goal._id.toString(),
      userId: goal.userId.toString(),
      title: goal.title,
      targetAmount: goal.targetAmount,
      bucket: goal.bucket,
      deadline: goal.deadline,
      category: goal.category,
      icon: goal.icon,
      allocatedAmount: allocation.allocatedAmount,
      stillRequired: allocation.stillRequired,
      progress: allocation.progress,
      status: allocation.status
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.goalModel.deleteOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Goal not found');

    // Also delete associated contributions
    await this.contributionModel.deleteMany({ goalId: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any).exec();
  }

  async getContributions(userId: string, goalId: string): Promise<GoalContributionDocument[]> {
    return this.contributionModel.find({ goalId: new Types.ObjectId(goalId), userId: new Types.ObjectId(userId) } as any).sort({ date: -1 }).exec();
  }

  async getGoalWithAllocation(userId: string, goalId: string): Promise<GoalWithAllocation> {
    const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(goalId), userId: new Types.ObjectId(userId) } as any).lean().exec();
    if (!goal) throw new NotFoundException('Goal not found');
    const allocation = await this.liquidFundsService.getGoalAllocationDetails(userId, goalId);
    return {
      _id: goal._id.toString(),
      userId: goal.userId.toString(),
      title: goal.title,
      targetAmount: goal.targetAmount,
      bucket: goal.bucket,
      deadline: goal.deadline,
      category: goal.category,
      icon: goal.icon,
      allocatedAmount: allocation.allocatedAmount,
      stillRequired: allocation.stillRequired,
      progress: allocation.progress,
      status: allocation.status
    };
  }

  async getGoalsSummary(userId: string): Promise<{
    totalGoals: number;
    totalTargets: number;
    totalAllocated: number;
    stillRequired: number;
    completedGoals: number;
    inProgressGoals: number;
  }> {
    const goals = await this.getGoalsWithAllocations(userId);
    return {
      totalGoals: goals.length,
      totalTargets: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalAllocated: goals.reduce((sum, g) => sum + g.allocatedAmount, 0),
      stillRequired: goals.reduce((sum, g) => sum + g.stillRequired, 0),
      completedGoals: goals.filter(g => g.status === 'COMPLETED').length,
      inProgressGoals: goals.filter(g => g.status === 'IN_PROGRESS').length,
    };
  }

  async getGoalsWithAllocations(userId: string): Promise<GoalWithAllocation[]> {
    const goals = await this.goalModel.find({ userId: new Types.ObjectId(userId) } as any).lean().exec();
    const allocations = await this.liquidFundsService.getAllGoalAllocations(userId);
    const allocationMap = new Map<string, any>();
    for (const alloc of allocations) {
      allocationMap.set(alloc.goalId, alloc);
    }
    const result: GoalWithAllocation[] = [];
    for (const goal of goals) {
      const allocation = allocationMap.get(goal._id.toString());
      if (allocation) {
        result.push({
          _id: goal._id.toString(),
          userId: goal.userId.toString(),
          title: goal.title,
          targetAmount: goal.targetAmount,
          bucket: goal.bucket,
          deadline: goal.deadline,
          category: goal.category,
          icon: goal.icon,
          allocatedAmount: allocation.allocatedAmount,
          stillRequired: allocation.stillRequired,
          progress: allocation.progress,
          status: allocation.status
        });
      } else {
        // If no allocation found, set to zero
        result.push({
          _id: goal._id.toString(),
          userId: goal.userId.toString(),
          title: goal.title,
          targetAmount: goal.targetAmount,
          bucket: goal.bucket,
          deadline: goal.deadline,
          category: goal.category,
          icon: goal.icon,
          allocatedAmount: 0,
          stillRequired: goal.targetAmount,
          progress: 0,
          status: goal.targetAmount > 0 ? 'IN_PROGRESS' : 'SET_TARGET'
        });
      }
    }
    return result;
  }
}