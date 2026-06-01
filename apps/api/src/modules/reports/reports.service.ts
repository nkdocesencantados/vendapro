import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Sale, SaleStatus } from "../sales/sale.entity";
import { Store } from "../stores/store.entity";
import { SaleItem } from "../sales/sale-item.entity";
import { Product } from "../products/product.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem) private itemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
  ) {}

  async dashboard(storeId: string, sellerId?: string) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const todayWhere: any = { storeId, status: SaleStatus.COMPLETED, saleDate: Between(todayStart, todayEnd) };
    const monthWhere: any = { storeId, status: SaleStatus.COMPLETED, saleDate: Between(monthStart, monthEnd) };
    if (sellerId) { todayWhere.sellerId = sellerId; monthWhere.sellerId = sellerId; }
    const todaySales = await this.saleRepo.find({ where: todayWhere });
    const monthSales = await this.saleRepo.find({ where: monthWhere });
    const todayTotal = todaySales.reduce((a, s) => a + Number(s.total), 0);
    const monthTotal = monthSales.reduce((a, s) => a + Number(s.total), 0);
    const avgTicket = monthSales.length ? monthTotal / monthSales.length : 0;
    const storeRows = await this.storeRepo.query(`SELECT "monthlyGoal", "profitMargin", margin FROM stores WHERE id = $1`, [storeId]);
    const monthGoal = storeRows?.[0]?.monthlyGoal ? Number(storeRows[0].monthlyGoal) : 20000;
    const weeklyChart = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const totalDays = today.getDate();
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(firstDay); d.setDate(firstDay.getDate() + i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const weekWhere: any = { storeId, status: SaleStatus.COMPLETED, saleDate: Between(start, end) };
      if (sellerId) weekWhere.sellerId = sellerId;
      const sales = await this.saleRepo.find({ where: weekWhere });
      const dd = String(d.getDate()).padStart(2,"0")
      const mm = String(d.getMonth()+1).padStart(2,"0")
      const yyyy = d.getFullYear()
      weeklyChart.push({ day: `${dd}/${mm}/${yyyy}`, value: sales.reduce((a, s) => a + Number(s.total), 0), count: sales.length });
    }
    const lowStock = await this.productRepo.createQueryBuilder("p").where("p.storeId = :storeId", { storeId }).andWhere("p.stock <= p.minStock").getMany();
    // topSellers
    const sellerMap: Record<string, { sellerName: string; count: number; revenue: number }> = {};
    for (const s of monthSales) {
      const key = s.sellerId || "owner";
      if (!sellerMap[key]) sellerMap[key] = { sellerName: (s as any).sellerName || key, count: 0, revenue: 0 };
      sellerMap[key].count += 1;
      sellerMap[key].revenue += Number(s.total);
    }
    const sellerIds = [...new Set(monthSales.map(s => s.sellerId).filter(Boolean))];
    const { User } = await import("../users/user.entity");
    const users = sellerIds.length > 0 ? await (this.saleRepo.manager.find(User, { where: sellerIds.map((id: string) => ({ id })) })) : [];
    const userMap: Record<string, string> = {};
    users.forEach((u: any) => userMap[u.id] = u.name);
    const topSellers = Object.entries(sellerMap).map(([id, v]) => ({ ...v, sellerName: userMap[id] || v.sellerName })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    // topProducts
    const monthSaleIds = monthSales.map(s => s.id);
    let topProducts: any[] = [];
    if (monthSaleIds.length > 0) {
      const items = await this.itemRepo.createQueryBuilder("i").where("i.saleId IN (:...ids)", { ids: monthSaleIds }).getMany();
      const prodMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
      for (const item of items) {
        const key = item.productId || item.productName || "avulso";
        if (!prodMap[key]) prodMap[key] = { name: item.productName || "Item avulso", quantity: 0, revenue: 0 };
        prodMap[key].quantity += Number(item.quantity);
        prodMap[key].revenue += Number(item.quantity) * Number(item.unitPrice);
      }
      topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }
    // recentSales
    const recentSales = await this.saleRepo.find({ where: { storeId, status: SaleStatus.COMPLETED }, order: { saleDate: "DESC" }, take: 5 });
    const recentSellerIds = [...new Set(recentSales.map(s => s.sellerId).filter(Boolean))];
    const recentUsers = recentSellerIds.length > 0 ? await (this.saleRepo.manager.find(User, { where: recentSellerIds.map((id: string) => ({ id })) })) : [];
    const recentUserMap: Record<string, string> = {};
    recentUsers.forEach((u: any) => recentUserMap[u.id] = u.name);
    const recentSalesData = recentSales.map(s => ({ ...s, sellerName: recentUserMap[s.sellerId] || null }));
    const rawMarginD = storeRows?.[0]?.profitMargin || storeRows?.[0]?.margin;
    const storeMargin = rawMarginD ? Number(rawMarginD) / 100 : 0.263;
    return { todaySales: todayTotal, monthSales: monthTotal, profit: Math.round(monthTotal * storeMargin), avgTicket: Math.round(avgTicket), totalSalesToday: todaySales.length, monthSalesCount: monthSales.length, monthGoal, monthGoalPct: Math.min(Math.round((monthTotal / monthGoal) * 100), 100), lowStock, weeklyChart, topSellers, topProducts, recentSales: recentSalesData };
  }

  async advanced(storeId: string, from: string, to: string, sellerId?: string) {
    const fromDate = new Date(from); fromDate.setHours(0,0,0,0);
    const toDate = new Date(to); toDate.setHours(23,59,59,999);
    const advWhere: any = { storeId, status: SaleStatus.COMPLETED, saleDate: Between(fromDate, toDate) };
    if (sellerId) advWhere.sellerId = sellerId;
    const sales = await this.saleRepo.find({ where: advWhere });
    const totalRevenue = sales.reduce((a, s) => a + Number(s.total), 0);
    const totalSales = sales.length;
    const avgTicket = totalSales ? totalRevenue / totalSales : 0;
    const estimatedProfit = totalRevenue * 0.263;
    const maxSale = sales.length ? Math.max(...sales.map(s => Number(s.total))) : 0;
    const minSale = sales.length ? Math.min(...sales.map(s => Number(s.total))) : 0;
    const dailyMap: Record<string, { value: number; count: number }> = {};
    for (const s of sales) {
      const day = new Date(s.saleDate || s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!dailyMap[day]) dailyMap[day] = { value: 0, count: 0 };
      dailyMap[day].value += Number(s.total);
      dailyMap[day].count += 1;
    }
    const dailyChart = Object.entries(dailyMap).map(([day, v]) => ({ day, ...v })).sort((a, b) => { const [da, ma] = a.day.split("/").map(Number); const [db, mb] = b.day.split("/").map(Number); return new Date(2026, mb-1, db).getTime() - new Date(2026, ma-1, da).getTime(); });
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
    const sellerMap: Record<string, { name: string; total: number; count: number }> = {};
    for (const s of sales) {
      if (!s.sellerId) continue;
      if (!sellerMap[s.sellerId]) sellerMap[s.sellerId] = { name: s.sellerId, total: 0, count: 0 };
      sellerMap[s.sellerId].total += Number(s.total);
      sellerMap[s.sellerId].count += 1;
    }
    if (Object.keys(sellerMap).length > 0) {
      const sellerIds = Object.keys(sellerMap);
      const placeholders = sellerIds.map((_, i) => "$" + (i + 1)).join(",");
      const users = await this.saleRepo.query("SELECT id, name FROM users WHERE id IN (" + placeholders + ")", sellerIds);
      for (const u of users) {
        if (sellerMap[u.id]) sellerMap[u.id].name = u.name;
      }
    }
    const sellerRanking = Object.values(sellerMap).sort((a: any, b: any) => b.total - a.total);
    const storeRows2 = await this.storeRepo.query(`SELECT "monthlyGoal" FROM stores WHERE id = $1`, [storeId]);
    const monthlyGoal = storeRows2?.[0]?.monthlyGoal ? Number(storeRows2[0].monthlyGoal) : 20000;
    const activeDays = Object.values(dailyMap).filter((v:any) => v.value > 0).length; return { totalRevenue, totalSales, avgTicket, estimatedProfit, maxSale, minSale, dailyChart, paymentMethods, topProducts, slowProducts, sellerRanking, monthlyGoal, cancelRate: 0, cancelCount: 0, activeDays };
  }

  async search(storeId: string, q: string) {
    if (!q || q.trim().length < 2) return { sales: [], products: [] }
    const term = q.trim().toLowerCase()
    const { Product } = await import("../products/product.entity")
    const products = await this.productRepo.createQueryBuilder("p")
      .where("p.storeId = :storeId", { storeId })
      .andWhere("LOWER(p.name) LIKE :term", { term: `%${term}%` })
      .take(5).getMany()
    const sales = await this.saleRepo.createQueryBuilder("s")
      .where("s.storeId = :storeId", { storeId })
      .andWhere("s.status = 'completed'")
      .andWhere("(s.customerName ILIKE :term OR CAST(s.total AS TEXT) LIKE :term)", { term: `%${term}%` })
      .orderBy("s.saleDate", "DESC")
      .take(5).getMany()
    return {
      products: products.map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price, type: "product" })),
      sales: sales.map(s => ({ id: s.id, customerName: s.customerName || "Cliente avulso", total: s.total, createdAt: s.createdAt, type: "sale" })),
    }
  }

}