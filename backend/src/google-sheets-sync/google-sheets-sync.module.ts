import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GoogleSheetsSyncService } from './google-sheets-sync.service';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';
import { SystemConfig, SystemConfigSchema } from '../schemas/system-config.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [GoogleSheetsSyncService],
  exports: [GoogleSheetsSyncService],
})
export class GoogleSheetsSyncModule {}
