import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioHoldingSchema } from '../schemas/portfolio-holding.schema';
import { PortfolioSyncLogSchema } from '../schemas/portfolio-sync-log.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { InvestmentSchema } from '../schemas/investment.schema';
import { IndmoneyConnectionSchema } from '../schemas/indmoney-connection.schema';
import { CurrencyConversionService } from '../services/currency-conversion.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'PortfolioHolding', schema: PortfolioHoldingSchema },
            { name: 'PortfolioSyncLog', schema: PortfolioSyncLogSchema },
            { name: User.name, schema: UserSchema },
            { name: 'Investment', schema: InvestmentSchema },
            { name: 'IndmoneyConnection', schema: IndmoneyConnectionSchema },
        ])
    ],
    controllers: [PortfolioController],
    providers: [PortfolioService, CurrencyConversionService],
    exports: [PortfolioService]
})
export class PortfolioModule { }
