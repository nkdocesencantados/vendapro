import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private repo: Repository<Store>) {}

  async findAll() {
    return this.repo.query(`SELECT id, name, "primaryColor", phone, "monthlyGoal", plan FROM stores ORDER BY "createdAt" DESC`);
  }

  async findOne(id: string) {
    const r = await this.repo.query(
      `SELECT id, name, "primaryColor", phone, "monthlyGoal", "profitMargin", margin, plan, status, "createdAt", palette FROM stores WHERE id = $1`, [id]
    );
    if (!r || r.length === 0) throw new NotFoundException('Loja nao encontrada');
    const store = r[0];
    const TRIAL_DAYS = 7;
    const created = new Date(store.createdAt);
    const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = store.status === 'trial' ? Math.max(0, TRIAL_DAYS - diffDays) : null;
    const trialExpired  = store.status === 'trial' && diffDays >= TRIAL_DAYS;
    return { ...store, trialDaysLeft, trialExpired };
  }

  async create(data: Partial<Store>) {
    const store = this.repo.create(data);
    return this.repo.save(store);
  }

  async update(id: string, data: any) {
    await this.repo.query(`UPDATE stores SET name = $1, "primaryColor" = $2, "monthlyGoal" = $3, "profitMargin" = $4, margin = $5 WHERE id = $6`,
      [data.name, data.primaryColor || '#0F6E56', data.monthlyGoal || 0, data.profitMargin || data.margin || 26.30, data.margin || data.profitMargin || 26.30, id]);
    return this.findOne(id);
  }
}