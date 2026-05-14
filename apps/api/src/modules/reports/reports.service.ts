import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Sale, SaleStatus } from "../sales/sale.entity";
import { SaleItem } from "../sales/sale-item.entity";
import { Product } from "../products/product.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async dashboard(storeId: string) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const todaySales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(todayStart, todayEnd) } });
    const monthSales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(monthStart, monthEnd) } });

    const todayTotal = todaySales.reduce((a, s) => a + Number(s.total), 0);
    const monthTotal = monthSales.reduce((a, s) => a + Number(s.total), 0);
    const avgTicket = todaySales.length ? todayTotal / todaySales.length : 0;
    const monthGoal = 20000;

    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const sales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(start, end) } });
      weeklyChart.push({ day: d.toLocaleDateString("pt-BR", { weekday: "short" }), value: sales.reduce((a, s) => a + Number(s.total), 0) });
    }

    const lowStock = await this.productRepo.createQueryBuilder("p").where("p.storeId = :storeId", { storeId }).andWhere("p.stock <= p.minStock").getMany();

    return { todaySales: todayTotal, monthSales: monthTotal, profit: Math.round(monthTotal * 0.263), avgTicket: Math.round(avgTicket), totalSalesToday: todaySales.length, monthGoal, monthGoalPct: Math.min(Math.round((monthTotal / monthGoal) * 100), 100), lowStock, weeklyChart };
  }

  async advanced(storeId: string, from: string, to: string) {
    const fromDate = new Date(from); fromDate.setHours(0,0,0,0);
    const toDate = new Date(to); toDate.setHours(23,59,59,999);

    const sales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(fromDate, toDate) } });
    const totalRevenue = sales.reduce((a, s) => a + Number(s.total), 0);
    const totalSales = sales.length;
    const avgTicket = totalSales ? totalRevenue / totalSales : 0;
    const estimatedProfit = totalRevenue * 0.263;
    const maxSale = sales.length ? Math.max(...sales.map(s => Number(s.total))) : 0;
    const minSale = sales.length ? Math.min(...sales.map(s => Number(s.total))) : 0;

    const dailyMap: Record<string, { value: number; count: number }> = {};
    for (const s of sales) {
      const day = new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!dailyMap[day]) dailyMap[day] = { value: 0, count: 0 };
      dailyMap[day].value += Number(s.total);
      dailyMap[day].count += 1;
    }
    const dailyChart = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v }));

    const paymentMap: Record<string, number> = {};
    for (const s of sales) {
      paymentMap[s.paymentMethod] = (paymentMap[s.paymentMethod] || 0) + Number(s.total);
    }
    const paymentMethods = Object.entries(paymentMap).map(([method, total]) => ({ method, total }));

    let topProducts: any[] = [];
    if (sales.length > 0) {
      const saleIds = sales.map(s => s.id);
      const items = await this.itemRepo.createQueryBuilder("i").where("i.saleId IN (:...ids)", { ids: saleIds }).getMany();
      const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const item of items) {
        const key = item.productId || item.productName || "avulso";
        if (!productMap[key]) productMap[key] = { name: item.productName || "Item avulso", quantity: 0, revenue: 0 };
        productMap[key].quantity += Number(item.quantity);
        productMap[key].revenue += Number(item.total);
      }
      topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    }

    const allProducts = await this.productRepo.find({ where: { storeId } });
    const soldNames = new Set(topProducts.map(p => p.name));
    const slowProducts = allProducts.filter(p => !soldNames.has(p.name)).length;

    return { totalRevenue, totalSales, avgTicket, estimatedProfit, maxSale, minSale, dailyChart, paymentMethods, topProducts, slowProducts };
  }
}