import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioEntry, PortfolioEntrySchema } from '../schemas/portfolio-entry.schema';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PortfolioEntry.name, schema: PortfolioEntrySchema },
            { name: Transaction.name, schema: TransactionSchema },
            { name: User.name, schema: UserSchema }
        ])
    ],
    controllers: [PortfolioController],
    providers: [PortfolioService],
    exports: [PortfolioService]
})
export class PortfolioModule { }
