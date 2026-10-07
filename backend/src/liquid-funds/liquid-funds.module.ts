import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiquidFundsService } from './liquid-funds.service';
import { LiquidFundsController } from './liquid-funds.controller';
import { LiquidFundTransaction, LiquidFundTransactionSchema } from '../schemas/liquid-fund-transaction.schema';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiquidFundTransaction.name, schema: LiquidFundTransactionSchema },
      { name: Goal.name, schema: GoalSchema }
    ]),
    forwardRef(() => GoalsModule),
  ],
  controllers: [LiquidFundsController],
  providers: [LiquidFundsService],
  exports: [LiquidFundsService],
})
export class LiquidFundsModule {}