import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { GoalsModule } from './goals/goals.module';
import { RecurringModule } from './recurring/recurring.module';
import { BudgetsModule } from './budgets/budgets.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { LendingModule } from './lending/lending.module';
import { SecurityModule } from './security/security.module';
import { EventsModule } from './events/events.module';
import { LiquidFundsModule } from './liquid-funds/liquid-funds.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Connection options for production reliability
        ...(configService.get<string>('NODE_ENV') === 'production' ? {
          serverSelectionTimeoutMS: 5000, // 5 second timeout to fail fast
          socketTimeoutMS: 45000, // 45 second socket timeout
          connectTimeoutMS: 10000, // 10 second initial connection timeout
          maxPoolSize: 10, // Maintain up to 10 socket connections
          retryWrites: true,
          retryReads: true,
        } : {}),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TransactionsModule,
    GoalsModule,
    RecurringModule,
    BudgetsModule,
    PortfolioModule,
    LendingModule,
    SecurityModule,
    EventsModule,
    LiquidFundsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
