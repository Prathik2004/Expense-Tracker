import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService],
})
export class WebhooksModule { }
