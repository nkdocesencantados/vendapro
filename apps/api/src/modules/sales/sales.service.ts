import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Sale, SaleStatus } from "./sale.entity";
import { SaleItem } from "./sale-item.entity";
import { Product } from "../products/product.entity";
import { FinancialEntry, EntryType, EntryCategory } from "../financial/financial-entry.entity";

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(FinancialEntry) private financialRepo: Repository<FinancialEntry>,
  ) {}

  findAll(storeId: string, from?: string, to?: string, sellerId?: string) {
    const where: any = { storeId };
    if (from && to) where.createdAt = Between(new Date(from), new Date(to));
    if (sellerId) where.sellerId = sellerId;
    return this.saleRepo.find({ where, order: { createdAt: "DESC" } });
  }

  async findOne(id: string) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException("Venda nao encontrada");
    const items = await this.itemRepo.find({ where: { saleId: id } });
    return { ...sale, items };
  }

  async create(data: any, storeId: string, sellerId: string) {
    const { items, ...saleData } = data;
    if (!items || items.length === 0) throw new BadRequestException("A venda precisa ter ao menos um item");

    for (const item of items) {
      if (item.productId) {
        const product = await this.productRepo.findOne({ where: { id: item.productId, storeId } });
        if (!product) throw new BadRequestException(`Produto nao encontrado: ${item.productId}`);
        if (product.stock < item.quantity) throw new BadRequestException(`Estoque insuficiente para "${product.name}". Disponivel: ${product.stock}`);
      }
    }

    const processedItems = items.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      productName: item.name || item.productName || "Item avulso",
      isManual: !item.productId,
    }));

    const subtotal = processedItems.reduce((a: number, i: any) => a + i.total, 0);
    const discount = Number(saleData.discount) || 0;
    const total = subtotal - discount;
    const commission = total * ((Number(saleData.commissionRate) || 15) / 100);

    const saleEntity = this.saleRepo.create({ ...saleData, storeId, sellerId, subtotal, total, commission, status: SaleStatus.COMPLETED });
    const savedSale: any = await this.saleRepo.save(saleEntity);
    const saleId: string = savedSale.id;

    for (const item of processedItems) {
      await this.itemRepo.save(this.itemRepo.create({
        saleId, productId: item.productId || null, productName: item.productName,
        quantity: item.quantity, unitPrice: item.unitPrice, total: item.total, isManual: item.isManual,
      }));
      if (item.productId) await this.productRepo.decrement({ id: item.productId }, "stock", item.quantity);
    }

    await this.financialRepo.save(this.financialRepo.create({
      type: EntryType.INCOME, category: EntryCategory.SALE,
      description: `Venda #${saleId.slice(0, 8)}`, amount: total,
      date: new Date(), isPaid: true, referenceId: saleId, storeId, createdById: sellerId,
    }));

    return { id: saleId, message: "Venda criada com sucesso" };
  }

  async cancel(id: string) {
    const sale = await this.saleRepo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException("Venda nao encontrada");
    if (sale.status === SaleStatus.CANCELLED) throw new BadRequestException("Venda ja cancelada");
    await this.saleRepo.update(id, { status: SaleStatus.CANCELLED });
    const items = await this.itemRepo.find({ where: { saleId: id } });
    for (const item of items) {
      if (item.productId && !item.isManual) await this.productRepo.increment({ id: item.productId }, "stock", item.quantity);
    }
    await this.financialRepo.delete({ referenceId: id });
    return { message: "Venda cancelada e estoque restaurado" };
  }

  async todaySummary(storeId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const sales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(today, tomorrow) } });
    const total = sales.reduce((a, s) => a + Number(s.total), 0);
    const avgTicket = sales.length ? total / sales.length : 0;
    return { total, count: sales.length, avgTicket };
  }
}