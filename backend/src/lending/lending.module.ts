import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LendingController } from './lending.controller';
import { LendingService } from './lending.service';
import { Lending, LendingSchema } from '../schemas/lending.schema';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Lending.name, schema: LendingSchema },
            { name: Transaction.name, schema: TransactionSchema },
        ]),
    ],
    controllers: [LendingController],
    providers: [LendingService],
})
export class LendingModule { }
