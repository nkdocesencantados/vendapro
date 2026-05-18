import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { Sale } from "../sales/sale.entity";
import { SaleItem } from "../sales/sale-item.entity";
import { Product } from "../products/product.entity";
import { User } from "../users/user.entity";
import { Store } from "../stores/store.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product, User, Store])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}