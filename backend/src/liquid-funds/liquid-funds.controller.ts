import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { LiquidFundsService } from './liquid-funds.service';
import { CreateLiquidFundDto } from './dto/create-liquid-fund.dto';
import { UpdateLiquidFundDto } from './dto/update-liquid-fund.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Goal, GoalDocument } from '../schemas/goal.schema';
import { Model, Types } from 'mongoose';

@UseGuards(JwtAuthGuard)
@Controller('liquid-funds')
export class LiquidFundsController {
  constructor(
    private readonly liquidFundsService: LiquidFundsService,
    @InjectModel(Goal.name) private goalModel: Model<GoalDocument>,
  ) {}

  private async validateGoalNotCompleted(userId: string, goalId?: string): Promise<void> {
    if (goalId) {
      const goal = await this.goalModel.findOne({ _id: new Types.ObjectId(goalId), userId: new Types.ObjectId(userId) } as any).exec();
      if (goal && goal.completed) {
        throw new BadRequestException('Cannot add transactions to a completed goal');
      }
    }
  }

  @Post()
  async create(@Request() req: any, @Body() createLiquidFundDto: CreateLiquidFundDto) {
    await this.validateGoalNotCompleted(req.user.userId, createLiquidFundDto.goalId);
    return this.liquidFundsService.create(req.user.userId, createLiquidFundDto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: any) {
    return this.liquidFundsService.findAll(req.user.userId, query);
  }

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.liquidFundsService.getLiquidFundSummary(req.user.userId);
  }

  @Get('goals-dropdown')
  getGoalsDropdown(@Request() req: any) {
    return this.liquidFundsService.getUserGoalsForDropdown(req.user.userId);
  }

  @Get('filter-options')
  getFilterOptions(@Request() req: any) {
    return this.liquidFundsService.getFilterOptions(req.user.userId);
  }

  @Get('goals/allocation')
  getAllGoalsAllocations(@Request() req: any) {
    return this.liquidFundsService.getAllGoalAllocations(req.user.userId);
  }

  @Get('goals/:id/allocation')
  getGoalAllocation(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.getGoalAllocationDetails(req.user.userId, id);
  }

  @Get('goals/:id/transactions')
  getTransactionsForGoal(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.getTransactionsForGoal(req.user.userId, id);
  }

  @Get('goals/summary')
  getGoalsSummary(@Request() req: any) {
    return this.liquidFundsService.getGoalsSummary(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateLiquidFundDto: UpdateLiquidFundDto) {
    // Validate new goalId if being updated
    await this.validateGoalNotCompleted(req.user.userId, updateLiquidFundDto.goalId);
    return this.liquidFundsService.update(req.user.userId, id, updateLiquidFundDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.remove(req.user.userId, id);
  }
}