import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { StockModule } from './modules/stock/stock.module';
import { FinancialModule } from './modules/financial/financial.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CompaniesModule } from './modules/companies/companies.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ReceivablesModule } from './modules/receivables/receivables.module';
import { GoalsModule } from './modules/goals/goals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    // one global limiter; throttler v6 applies every named limiter to every route, so the strict login limit lives on the login route only
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 120 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
    }),
    AuthModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    SalesModule,
    StockModule,
    FinancialModule,
    ReportsModule,    
    CompaniesModule,
    ScheduleModule.forRoot(),
    SchedulerModule,
    CustomersModule,
    ReceivablesModule,
    GoalsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

