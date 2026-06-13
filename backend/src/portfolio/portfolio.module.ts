import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioHoldingSchema } from '../schemas/portfolio-holding.schema';
import { PortfolioSyncLogSchema } from '../schemas/portfolio-sync-log.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'PortfolioHolding', schema: PortfolioHoldingSchema },
            { name: 'PortfolioSyncLog', schema: PortfolioSyncLogSchema },
            { name: User.name, schema: UserSchema }
        ])
    ],
    controllers: [PortfolioController],
    providers: [PortfolioService],
    exports: [PortfolioService]
})
export class PortfolioModule { }
