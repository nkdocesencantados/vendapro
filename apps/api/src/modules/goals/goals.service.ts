import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goal.entity';

@Injectable()
export class GoalsService {
  constructor(@InjectRepository(Goal) private repo: Repository<Goal>) {}

  private currentMonth() {
    return new Date().toLocaleDateString('sv-SE').slice(0, 7);
  }

  async current(storeId: string) {
    const month = this.currentMonth();
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const goal = await this.repo.findOne({ where: { storeId, month } });
    const [row] = await this.repo.query(
      `SELECT COALESCE(SUM(total), 0) AS achieved FROM sales
       WHERE "storeId" = $1 AND status = 'completed' AND COALESCE("saleDate", "createdAt") >= $2 AND COALESCE("saleDate", "createdAt") < $3`,
      [storeId, start, end],
    );
    const target = goal ? Number(goal.target) : 0;
    const achieved = Number(row.achieved);
    const remaining = Math.max(Math.round((target - achieved) * 100) / 100, 0);
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1; // inclui hoje
    return {
      month, target, achieved,
      percent: target > 0 ? Math.round((achieved / target) * 1000) / 10 : 0,
      remaining, daysLeft,
      perDay: Math.round((remaining / daysLeft) * 100) / 100,
    };
  }

  async setCurrent(storeId: string, target: number) {
    await this.repo.upsert({ storeId, month: this.currentMonth(), target }, ['storeId', 'month']);
    return this.current(storeId);
  }
}
