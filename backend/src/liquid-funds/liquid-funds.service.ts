import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LiquidFundTransaction, LiquidFundTransactionDocument, LiquidFundTransactionType } from '../schemas/liquid-fund-transaction.schema';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import { CreateLiquidFundDto, LiquidFundTransactionType as CreateLiquidFundTransactionType } from './dto/create-liquid-fund.dto';
import { UpdateLiquidFundDto } from './dto/update-liquid-fund.dto';
import { GoalsService } from '../goals/goals.service';

export interface GoalAllocationResult {
  goalId: string;
  goalName: string;
  bucket: string;
  targetAmount: number;
  allocatedAmount: number;
  stillRequired: number;
  progress: number | null;
  status: string;
}

export interface LiquidFundSummary {
  totalInvested: number;
  totalReturned: number;
  totalWithdrawn: number;
  netLiquidFunds: number;
  fundBreakdown: { fundName: string; invested: number; returned: number; withdrawn: number; net: number }[];
}

@Injectable()
export class LiquidFundsService {
  constructor(
    @InjectModel(LiquidFundTransaction.name) private liquidFundModel: Model<LiquidFundTransactionDocument>,
    @InjectModel(Goal.name) private goalModel: Model<GoalDocument>,
    @Inject(forwardRef(() => GoalsService)) private goalsService: GoalsService,
  ) {}

  async create(userId: string, createLiquidFundDto: CreateLiquidFundDto): Promise<LiquidFundTransactionDocument> {
    // Validate goal if provided
    if (createLiquidFundDto.goalId) {
      const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(createLiquidFundDto.goalId), userId: new Types.ObjectId(userId) } as any).exec();
      if (!goal) {
        throw new BadRequestException('Goal not found or does not belong to user');
      }
      // Validate bucket matches goal's bucket
      if (createLiquidFundDto.bucket !== goal.bucket) {
        throw new BadRequestException('Transaction bucket must match the goal bucket');
      }
    }

    const createdTransaction = new this.liquidFundModel({
      ...createLiquidFundDto,
      userId: new Types.ObjectId(userId),
      goalId: createLiquidFundDto.goalId ? new Types.ObjectId(createLiquidFundDto.goalId) : undefined,
    });
    return createdTransaction.save();
  }

  async findAll(userId: string, query: any): Promise<{
    data: LiquidFundTransactionDocument[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const {
      page = 1,
      limit = 10,
      fundName,
      bucket,
      transactionType,
      goalId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sort = 'date',
      order = 'desc'
    } = query;

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (fundName) filter.fundName = { $regex: fundName, $options: 'i' };
    if (bucket) filter.bucket = bucket;
    if (transactionType) filter.transactionType = transactionType;
    if (goalId) filter.goalId = new Types.ObjectId(goalId);
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

    const sortObj: any = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;
    if (sort !== 'createdAt') {
      sortObj.createdAt = order === 'asc' ? 1 : -1;
    }

    const currentPage = Math.max(1, Number(page));
    const itemsPerPage = Math.max(1, Number(limit));
    const skip = (currentPage - 1) * itemsPerPage;

    const [data, totalItems] = await Promise.all([
      this.liquidFundModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(itemsPerPage)
        .populate('goalId', 'title bucket')
        .exec(),
      this.liquidFundModel.countDocuments(filter).exec()
    ]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      data,
      totalItems,
      totalPages,
      currentPage
    };
  }

  async findOne(userId: string, id: string): Promise<LiquidFundTransactionDocument> {
    const transaction = await this.liquidFundModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any).exec();
    if (!transaction) throw new NotFoundException('Liquid fund transaction not found');
    return transaction;
  }

  async update(userId: string, id: string, updateLiquidFundDto: UpdateLiquidFundDto): Promise<LiquidFundTransactionDocument> {
    // Get existing transaction for comparison
    const existingTransaction = await this.findOne(userId, id);

    // Validate goal if provided
    if (updateLiquidFundDto.goalId) {
      const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(updateLiquidFundDto.goalId), userId: new Types.ObjectId(userId) } as any).exec();
      if (!goal) {
        throw new BadRequestException('Goal not found or does not belong to user');
      }
      // Validate bucket matches goal's bucket
      const bucket = updateLiquidFundDto.bucket || existingTransaction.bucket;
      if (bucket !== goal.bucket) {
        throw new BadRequestException('Transaction bucket must match the goal bucket');
      }
    }

    // If goalId is explicitly set to null/empty string, remove the goal association
    const updateData: any = { ...updateLiquidFundDto };
    if (updateLiquidFundDto.goalId === null || updateLiquidFundDto.goalId === '') {
      updateData.goalId = undefined;
    } else if (updateLiquidFundDto.goalId) {
      updateData.goalId = new Types.ObjectId(updateLiquidFundDto.goalId);
    }

    const transaction = await this.liquidFundModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any,
      updateData,
      { new: true }
    ).exec();

    if (!transaction) throw new NotFoundException('Liquid fund transaction not found');
    return transaction;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.liquidFundModel.deleteOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Liquid fund transaction not found');
  }

  /**
   * Calculate goal allocation from liquid fund transactions
   * This is the core business logic - only counts transactions where:
   * 1. userId matches
   * 2. goalId matches the goal
   * 3. bucket matches the goal's bucket
   * 4. transactionType is INVEST, RETURN, or WITHDRAW
   */
  async calculateGoalAllocation(userId: string, goalId: string, bucket: string): Promise<number> {
    const transactions = await this.liquidFundModel.find({
      userId: new Types.ObjectId(userId),
      goalId: new Types.ObjectId(goalId),
      bucket: bucket,
      transactionType: { $in: [CreateLiquidFundTransactionType.INVEST, CreateLiquidFundTransactionType.RETURN, CreateLiquidFundTransactionType.WITHDRAW] }
    } as any).exec();

    let allocated = 0;
    for (const tx of transactions) {
      if (tx.transactionType === CreateLiquidFundTransactionType.INVEST ||
          tx.transactionType === CreateLiquidFundTransactionType.RETURN) {
        allocated += tx.amount;
      } else if (tx.transactionType === CreateLiquidFundTransactionType.WITHDRAW) {
        allocated -= tx.amount;
      }
    }
    return Math.max(0, allocated);
  }

  /**
   * Get goal allocation details including all derived values
   */
  async getGoalAllocationDetails(userId: string, goalId: string): Promise<GoalAllocationResult> {
    const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(goalId), userId: new Types.ObjectId(userId) } as any).exec();
    if (!goal) throw new NotFoundException('Goal not found');

    const allocatedAmount = await this.calculateGoalAllocation(userId, goalId, goal.bucket);
    const stillRequired = Math.max(goal.targetAmount - allocatedAmount, 0);
    const progress = goal.targetAmount > 0 ? allocatedAmount / goal.targetAmount : null;

    let status = 'IN_PROGRESS';
    if (!goal.targetAmount || goal.targetAmount <= 0) {
      status = 'SET_TARGET';
    } else if (allocatedAmount >= goal.targetAmount) {
      status = 'FUNDED';
    } else if (goal.deadline && new Date(goal.deadline) < new Date()) {
      status = 'OVERDUE';
    }

    return {
      goalId: goal._id.toString(),
      goalName: goal.title,
      bucket: goal.bucket,
      targetAmount: goal.targetAmount,
      allocatedAmount,
      stillRequired,
      progress,
      status
    };
  }

  /**
   * Get all goal allocations for a user
   */
  async getAllGoalAllocations(userId: string): Promise<GoalAllocationResult[]> {
    const goals = await this.goalModel.find({ userId: new Types.ObjectId(userId) } as any).exec();
    const allocations = await Promise.all(
      goals.map(goal => this.getGoalAllocationDetails(userId, goal._id.toString()))
    );
    return allocations;
  }

  /**
   * Get goal summary for the user
   */
  async getGoalsSummary(userId: string): Promise<{
    totalTargets: number;
    totalAllocated: number;
    stillRequired: number;
  }> {
    const allocations = await this.getAllGoalAllocations(userId);

    const totalTargets = allocations.reduce((sum, a) => sum + a.targetAmount, 0);
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const stillRequired = allocations.reduce((sum, a) => sum + a.stillRequired, 0);

    return { totalTargets, totalAllocated, stillRequired };
  }

  /**
   * Get liquid fund summary for the user (overall, not goal-specific)
   */
  async getLiquidFundSummary(userId: string): Promise<LiquidFundSummary> {
    const transactions = await this.liquidFundModel.find({ userId: new Types.ObjectId(userId) } as any).exec();

    let totalInvested = 0;
    let totalReturned = 0;
    let totalWithdrawn = 0;

    const fundMap = new Map<string, { invested: number; returned: number; withdrawn: number; net: number }>();

    for (const tx of transactions) {
      const fundData = fundMap.get(tx.fundName) || { invested: 0, returned: 0, withdrawn: 0, net: 0 };

      if (tx.transactionType === CreateLiquidFundTransactionType.INVEST) {
        totalInvested += tx.amount;
        fundData.invested += tx.amount;
        fundData.net += tx.amount;
      } else if (tx.transactionType === CreateLiquidFundTransactionType.RETURN) {
        totalReturned += tx.amount;
        fundData.returned += tx.amount;
        fundData.net += tx.amount;
      } else if (tx.transactionType === CreateLiquidFundTransactionType.WITHDRAW) {
        totalWithdrawn += tx.amount;
        fundData.withdrawn += tx.amount;
        fundData.net -= tx.amount;
      }

      fundMap.set(tx.fundName, fundData);
    }

    const fundBreakdown = Array.from(fundMap.entries()).map(([fundName, data]) => ({
      fundName,
      ...data
    }));

    return {
      totalInvested,
      totalReturned,
      totalWithdrawn,
      netLiquidFunds: totalInvested + totalReturned - totalWithdrawn,
      fundBreakdown
    };
  }

  /**
   * Get user's goals for dropdown selection in liquid fund transaction form
   */
  async getUserGoalsForDropdown(userId: string): Promise<{ _id: string; title: string; bucket: string; targetAmount: number }[]> {
    const goals = await this.goalModel.find(
      { userId: new Types.ObjectId(userId) } as any,
      { _id: 1, title: 1, bucket: 1, targetAmount: 1 }
    ).exec();

    return goals.map(g => ({
      _id: g._id.toString(),
      title: g.title,
      bucket: g.bucket,
      targetAmount: g.targetAmount
    }));
  }

  /**
   * Get transactions associated with a specific goal (for goal detail view)
   */
  async getTransactionsForGoal(userId: string, goalId: string): Promise<LiquidFundTransactionDocument[]> {
    const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(goalId), userId: new Types.ObjectId(userId) } as any).exec();
    if (!goal) throw new NotFoundException('Goal not found');

    return this.liquidFundModel.find({
      userId: new Types.ObjectId(userId),
      goalId: new Types.ObjectId(goalId),
      bucket: goal.bucket
    } as any).sort({ date: -1 }).exec();
  }
}