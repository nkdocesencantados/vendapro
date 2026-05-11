import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Sale } from '../sales/sale.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { FinancialEntry } from '../financial/financial-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Product, User, FinancialEntry])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
