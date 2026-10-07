import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { GoalContribution, GoalContributionSchema } from '../schemas/goal-contribution.schema';
import { LiquidFundsModule } from '../liquid-funds/liquid-funds.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Goal.name, schema: GoalSchema },
      { name: GoalContribution.name, schema: GoalContributionSchema }
    ]),
    forwardRef(() => LiquidFundsModule),
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule { }
