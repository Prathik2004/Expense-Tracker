import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringService } from './recurring.service';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    PortfolioModule,
  ],
  providers: [RecurringService],
})
export class RecurringModule { }
