import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(@InjectModel(Goal.name) private goalModel: Model<GoalDocument>) { }

  async create(userId: string, createGoalDto: CreateGoalDto): Promise<GoalDocument> {
    const createdGoal = new this.goalModel({
      ...createGoalDto,
      userId,
    });
    return createdGoal.save();
  }

  async findAll(userId: string): Promise<GoalDocument[]> {
    return this.goalModel.find({ userId } as any).exec();
  }

  async findOne(userId: string, id: string): Promise<GoalDocument> {
    const goal = await this.goalModel.findOne({ _id: id, userId } as any).exec();
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto): Promise<GoalDocument> {
    const goal = await this.goalModel.findOneAndUpdate(
      { _id: id, userId } as any,
      updateGoalDto,
      { new: true }
    ).exec();
    if (!goal) throw new NotFoundException('Goal not found');
    return goal as any;
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.goalModel.deleteOne({ _id: id, userId } as any).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Goal not found');
  }

  async deposit(userId: string, id: string, amount: number): Promise<GoalDocument> {
    const goal = await this.goalModel.findOneAndUpdate(
      { _id: id, userId } as any,
      { $inc: { currentAmount: amount } },
      { new: true }
    ).exec();
    if (!goal) throw new NotFoundException('Goal not found');
    return goal as any;
  }
}
