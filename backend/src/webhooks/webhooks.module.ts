import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { Transaction, TransactionSchema } from '../schemas/transaction.schema.js';
import { User, UserSchema } from '../schemas/user.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
            { name: User.name, schema: UserSchema }
        ]),
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService],
})
export class WebhooksModule { }
