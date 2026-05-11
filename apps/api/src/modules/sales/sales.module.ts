import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from '../products/product.entity';
import { FinancialEntry } from '../financial/financial-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product, FinancialEntry])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
