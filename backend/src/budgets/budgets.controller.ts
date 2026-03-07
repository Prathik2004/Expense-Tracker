import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) { }

  @Post()
  create(@Request() req: any, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.userId, createBudgetDto);
  }

  @Get()
  findAll(@Request() req: any, @Query('month') month?: string) {
    return this.budgetsService.findAll(req.user.userId, month);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.budgetsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateBudgetDto: UpdateBudgetDto) {
    return this.budgetsService.update(req.user.userId, id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.budgetsService.remove(req.user.userId, id);
  }
}
