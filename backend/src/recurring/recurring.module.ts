import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringService } from './recurring.service';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]), NotificationsModule],
  providers: [RecurringService],
})
export class RecurringModule { }
