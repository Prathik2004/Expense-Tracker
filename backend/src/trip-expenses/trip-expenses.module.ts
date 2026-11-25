import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TripExpenseLog,
  TripExpenseLogSchema,
} from '../schemas/trip-expense-log.schema';
import { TripExpensesController } from './trip-expenses.controller';
import { TripExpensesService } from './trip-expenses.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TripExpenseLog.name, schema: TripExpenseLogSchema },
    ]),
  ],
  controllers: [TripExpensesController],
  providers: [TripExpensesService],
})
export class TripExpensesModule {}
