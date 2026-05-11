import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from '../products/product.entity';
import { FinancialEntry, EntryType, EntryCategory } from '../financial/financial-entry.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(FinancialEntry) private financialRepo: Repository<FinancialEntry>,
  ) {}

  findAll(storeId: string, from?: string, to?: string) {
    const where: any = { storeId };
    if (from && to) where.createdAt = Between(new Date(from), new Date(to));
    return this.saleRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Venda nao encontrada');
    const items = await this.itemRepo.find({ where: { saleId: id } });
    return { ...sale, items };
  }

  async create(data: any, storeId: string, sellerId: string) {
    const { items, ...saleData } = data;
    const subtotal = items.reduce((a: number, i: any) => a + i.unitPrice * i.quantity, 0);
    const discount = saleData.discount || 0;
    const total = subtotal - discount;
    const commission = total * ((saleData.commissionRate || 15) / 100);

    const saleEntity = this.saleRepo.create({
      ...saleData, storeId, sellerId, subtotal, total, commission,
      status: SaleStatus.COMPLETED,
    });
    const savedAny: any = await this.saleRepo.save(saleEntity);
    const savedId: string = savedAny.id;

    for (const item of items) {
      await this.itemRepo.save(this.itemRepo.create({ ...item, saleId: savedId }));
      if (item.productId && !item.isManual) {
        await this.productRepo.decrement({ id: item.productId }, 'stock', item.quantity);
      }
    }
git add .
git commit -m "fix: usar any para contornar tipo Sale no save"
git push

git add .
git commit -m "fix: usar any para contornar tipo Sale no save"
git push
@'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from './sale.entity';
import { SaleItem } from './sale-item.entity';
import { Product } from '../products/product.entity';
import { FinancialEntry, EntryType, EntryCategory } from '../financial/financial-entry.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(FinancialEntry) private financialRepo: Repository<FinancialEntry>,
  ) {}

  findAll(storeId: string, from?: string, to?: string) {
    const where: any = { storeId };
    if (from && to) where.createdAt = Between(new Date(from), new Date(to));
    return this.saleRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Venda nao encontrada');
    const items = await this.itemRepo.find({ where: { saleId: id } });
    return { ...sale, items };
  }

  async create(data: any, storeId: string, sellerId: string) {
    const { items, ...saleData } = data;
    const subtotal = items.reduce((a: number, i: any) => a + i.unitPrice * i.quantity, 0);
    const discount = saleData.discount || 0;
    const total = subtotal - discount;
    const commission = total * ((saleData.commissionRate || 15) / 100);

    const saleEntity = this.saleRepo.create({
      ...saleData, storeId, sellerId, subtotal, total, commission,
      status: SaleStatus.COMPLETED,
    });
    const savedAny: any = await this.saleRepo.save(saleEntity);
    const savedId: string = savedAny.id;

    for (const item of items) {
      await this.itemRepo.save(this.itemRepo.create({ ...item, saleId: savedId }));
      if (item.productId && !item.isManual) {
        await this.productRepo.decrement({ id: item.productId }, 'stock', item.quantity);
      }
    }

    await this.financialRepo.save(this.financialRepo.create({
      type: EntryType.INCOME,
      category: EntryCategory.SALE,
      description: `Venda #${savedId.slice(0,8)}`,
      amount: total,
      date: new Date(),
      isPaid: true,
      referenceId: savedId,
      storeId,
      createdById: sellerId,
    }));

    return this.findOne(savedId);
  }

  async cancel(id: string) {
    await this.saleRepo.update(id, { status: SaleStatus.CANCELLED });
    const items = await this.itemRepo.find({ where: { saleId: id } });
    for (const item of items) {
      if (item.productId && !item.isManual) {
        await this.productRepo.increment({ id: item.productId }, 'stock', item.quantity);
      }
    }
    return { message: 'Venda cancelada' };
  }

  async todaySummary(storeId: string) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sales = await this.saleRepo.find({
      where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(today, tomorrow) },
    });
    const total = sales.reduce((a, s) => a + Number(s.total), 0);
    const avgTicket = sales.length ? total / sales.length : 0;
    return { total, count: sales.length, avgTicket };
  }
}
