import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) { }

  @Post()
  create(@Request() req: any, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.userId, createGoalDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.goalsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.goalsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto) {
    return this.goalsService.update(req.user.userId, id, updateGoalDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.goalsService.remove(req.user.userId, id);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/deposit')
  deposit(
    @Request() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('assetType') assetType: string,
    @Body('notes') notes: string
  ) {
    return this.goalsService.deposit(req.user.userId, id, amount, assetType, notes);
  }

  @Get(':id/contributions')
  getContributions(@Request() req: any, @Param('id') id: string) {
    return this.goalsService.getContributions(req.user.userId, id);
  }

  @Delete(':id/contributions/:contributionId')
  removeContribution(
    @Request() req: any,
    @Param('id') id: string,
    @Param('contributionId') contributionId: string
  ) {
    return this.goalsService.removeContribution(req.user.userId, id, contributionId);
  }
}
