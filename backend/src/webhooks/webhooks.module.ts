import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService],
})
export class WebhooksModule { }
