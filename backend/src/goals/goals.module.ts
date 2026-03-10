import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { Goal, GoalSchema } from '../schemas/goal.schema';
import { GoalContribution, GoalContributionSchema } from '../schemas/goal-contribution.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Goal.name, schema: GoalSchema },
    { name: GoalContribution.name, schema: GoalContributionSchema }
  ])],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule { }
