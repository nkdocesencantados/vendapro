import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FinancialEntry, EntryType } from './financial-entry.entity';

@Injectable()
export class FinancialService {
  constructor(@InjectRepository(FinancialEntry) private repo: Repository<FinancialEntry>) {}

  findAll(storeId: string, from?: string, to?: string) {
    const where: any = { storeId };
    if (from && to) where.date = Between(new Date(from), new Date(to));
    return this.repo.find({ where, order: { date: 'DESC' } });
  }

  create(data: Partial<FinancialEntry>) {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  async summary(storeId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59);
    const entries = await this.repo.find({
      where: { storeId, date: Between(from, to) },
    });
    const income = entries.filter(e => e.type === EntryType.INCOME).reduce((a, e) => a + Number(e.amount), 0);
    const expense = entries.filter(e => e.type === EntryType.EXPENSE).reduce((a, e) => a + Number(e.amount), 0);
    return { income, expense, profit: income - expense, entries };
  }
}