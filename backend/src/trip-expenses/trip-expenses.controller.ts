import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTripExpensesBulkDto } from './dto/create-trip-expenses-bulk.dto';
import { CreateTripExpenseDto } from './dto/create-trip-expense.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { MigrateLocalTripDto } from './dto/migrate-local-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripExpensesService } from './trip-expenses.service';

interface AuthenticatedTripRequest {
  user: {
    userId: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('trip-expenses')
export class TripExpensesController {
  constructor(private readonly tripExpensesService: TripExpensesService) {}

  @Get('trips')
  findAll(@Request() req: AuthenticatedTripRequest) {
    return this.tripExpensesService.findAll(req.user.userId);
  }

  @Post('trips')
  create(@Request() req: AuthenticatedTripRequest, @Body() dto: CreateTripDto) {
    return this.tripExpensesService.create(req.user.userId, dto);
  }

  @Post('trips/migrate-local')
  migrateLocal(
    @Request() req: AuthenticatedTripRequest,
    @Body() dto: MigrateLocalTripDto,
  ) {
    return this.tripExpensesService.migrateLocal(req.user.userId, dto);
  }

  @Patch('trips/:tripId')
  update(
    @Request() req: AuthenticatedTripRequest,
    @Param('tripId') tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripExpensesService.update(req.user.userId, tripId, dto);
  }

  @Delete('trips/:tripId')
  remove(
    @Request() req: AuthenticatedTripRequest,
    @Param('tripId') tripId: string,
  ) {
    return this.tripExpensesService.remove(req.user.userId, tripId);
  }

  @Post('trips/:tripId/expenses')
  addExpense(
    @Request() req: AuthenticatedTripRequest,
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripExpenseDto,
  ) {
    return this.tripExpensesService.addExpenses(req.user.userId, tripId, [dto]);
  }

  @Post('trips/:tripId/expenses/bulk')
  addExpenses(
    @Request() req: AuthenticatedTripRequest,
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripExpensesBulkDto,
  ) {
    return this.tripExpensesService.addExpenses(
      req.user.userId,
      tripId,
      dto.expenses,
    );
  }

  @Delete('trips/:tripId/expenses/:expenseId')
  removeExpense(
    @Request() req: AuthenticatedTripRequest,
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return this.tripExpensesService.removeExpense(
      req.user.userId,
      tripId,
      expenseId,
    );
  }
}
