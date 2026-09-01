import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndmoneyController } from './indmoney.controller';
import { IndmoneyService } from './indmoney.service';
import { IndmoneyAuthService } from './indmoney-auth.service';
import { IndmoneyClientService } from './indmoney-client.service';
import { IndmoneyNormalizerService } from './indmoney-normalizer.service';
import { IndmoneySyncService } from './indmoney-sync.service';
import { IndmoneyConnectionSchema } from '../../schemas/indmoney-connection.schema';
import { InvestmentSchema } from '../../schemas/investment.schema';
import { IndmoneyStateSchema } from '../../schemas/indmoney-state.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'IndmoneyConnection', schema: IndmoneyConnectionSchema },
    { name: 'Investment', schema: InvestmentSchema },
    { name: 'IndmoneyState', schema: IndmoneyStateSchema },
  ])],
  controllers: [IndmoneyController],
  providers: [IndmoneyService, IndmoneyAuthService, IndmoneyClientService, IndmoneyNormalizerService, IndmoneySyncService],
  exports: [IndmoneyService],
})
export class IndmoneyModule {}
