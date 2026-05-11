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

  async summary(storeId: string, month: number, year: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    const entries = await this.repo.find({
      where: { storeId, date: Between(from, to) },
    });
    const income  = entries.filter(e => e.type === EntryType.INCOME).reduce((a, e) => a + Number(e.amount), 0);
    const expense = entries.filter(e => e.type === EntryType.EXPENSE).reduce((a, e) => a + Number(e.amount), 0);
    return { income, expense, profit: income - expense, entries };
  }
}
