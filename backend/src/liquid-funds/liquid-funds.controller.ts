import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LiquidFundsService } from './liquid-funds.service';
import { CreateLiquidFundDto } from './dto/create-liquid-fund.dto';
import { UpdateLiquidFundDto } from './dto/update-liquid-fund.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GoalAllocationResult } from './liquid-funds.service';

@UseGuards(JwtAuthGuard)
@Controller('liquid-funds')
export class LiquidFundsController {
  constructor(private readonly liquidFundsService: LiquidFundsService) {}

  @Post()
  create(@Request() req: any, @Body() createLiquidFundDto: CreateLiquidFundDto) {
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

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateLiquidFundDto: UpdateLiquidFundDto) {
    return this.liquidFundsService.update(req.user.userId, id, updateLiquidFundDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.liquidFundsService.remove(req.user.userId, id);
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
}