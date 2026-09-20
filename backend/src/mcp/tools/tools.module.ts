import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MCPModule } from '../mcp.module';
import { PortfolioTools } from './portfolio.tools';
import { BudgetTools } from './budget.tools';
import { TransactionTools } from './transaction.tools';
import { GoalsTools } from './goals.tools';
import { InvestmentTools } from './investment.tools';
import { Budget, BudgetSchema } from '../../schemas/budget.schema';
import { GoalContribution, GoalContributionSchema } from '../../schemas/goal-contribution.schema';
import { Goal, GoalSchema } from '../../schemas/goal.schema';
import { Investment, InvestmentSchema } from '../../schemas/investment.schema';
import { PortfolioHoldingSchema } from '../../schemas/portfolio-holding.schema';
import { PortfolioSnapshot, PortfolioSnapshotSchema } from '../../schemas/portfolio-snapshot.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';

@Module({
  imports: [
    forwardRef(() => MCPModule),
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: GoalContribution.name, schema: GoalContributionSchema },
      { name: Investment.name, schema: InvestmentSchema },
      { name: 'PortfolioHolding', schema: PortfolioHoldingSchema },
      { name: PortfolioSnapshot.name, schema: PortfolioSnapshotSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [
    PortfolioTools,
    BudgetTools,
    TransactionTools,
    GoalsTools,
    InvestmentTools,
  ],
  exports: [
    PortfolioTools,
    BudgetTools,
    TransactionTools,
    GoalsTools,
    InvestmentTools,
  ],
})
export class ToolsModule {}
