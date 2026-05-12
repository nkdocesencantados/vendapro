import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../sales/sale.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async dashboard(storeId: string) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const todaySales = await this.saleRepo.find({
      where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(todayStart, todayEnd) },
    });
    const monthSales = await this.saleRepo.find({
      where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(monthStart, monthEnd) },
    });

    const todayTotal = todaySales.reduce((a, s) => a + Number(s.total), 0);
    const monthTotal = monthSales.reduce((a, s) => a + Number(s.total), 0);
    const avgTicket = todaySales.length ? todayTotal / todaySales.length : 0;
    const profit = monthTotal * 0.263;
    const monthGoal = 20000;
    const monthGoalPct = Math.min(Math.round((monthTotal / monthGoal) * 100), 100);

    const weeklyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const sales = await this.saleRepo.find({
        where: { storeId, status: SaleStatus.COMPLETED, createdAt: Between(start, end) },
      });
      weeklyChart.push({
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: sales.reduce((a, s) => a + Number(s.total), 0),
      });
    }

    const lowStock = await this.productRepo
      .createQueryBuilder('p')
      .where('p.storeId = :storeId', { storeId })
      .andWhere('p.stock <= p.minStock')
      .getMany();

    return {
      todaySales: todayTotal,
      monthSales: monthTotal,
      profit: Math.round(profit),
      avgTicket: Math.round(avgTicket),
      totalSalesToday: todaySales.length,
      monthGoal,
      monthGoalPct,
      lowStock,
      weeklyChart,
    };
  }
}