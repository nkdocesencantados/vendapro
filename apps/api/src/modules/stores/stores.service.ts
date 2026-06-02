import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from './store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private repo: Repository<Store>) {}

  async findAll() {
    return this.repo.query(`SELECT id, name, "primaryColor", phone, "monthlyGoal", plan FROM stores ORDER BY "createdAt" DESC`);
  }

  async findOne(id: string) {
    const r = await this.repo.query(
      `SELECT id, name, "primaryColor", phone, "monthlyGoal", COALESCE("profitMargin", 26.30) as "profitMargin", COALESCE(margin, 26.30) as margin, plan, COALESCE(status, 'trial') as status, "createdAt", COALESCE(palette, 'emerald') as palette FROM stores WHERE id = $1`, [id]
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
    const paidPlans = ['business', 'pro', 'starter', 'basic'];
    const isPaid = data.plan && paidPlans.includes((data.plan as string).toLowerCase());
    const status: StoreStatus = isPaid ? StoreStatus.ACTIVE : StoreStatus.TRIAL;
    const store = this.repo.create({ ...data, status });
    return this.repo.save(store);
  }

  async update(id: string, data: any) {
    await this.repo.query(
      `UPDATE stores SET name = $1, "primaryColor" = $2, "monthlyGoal" = $3 WHERE id = $4`,
      [data.name, data.primaryColor || '#0F6E56', data.monthlyGoal || 0, id]
    );
    try { await this.repo.query(`UPDATE stores SET "profitMargin" = $1, margin = $2 WHERE id = $3`, [data.profitMargin || data.margin || 26.30, data.margin || data.profitMargin || 26.30, id]); } catch(e) {}
    try { await this.repo.query(`UPDATE stores SET phone = $1, cnpj = $2 WHERE id = $3`, [data.phone || null, data.cnpj || null, id]); } catch(e) {}
    try { await this.repo.query(`UPDATE stores SET palette = $1 WHERE id = $2`, [data.palette || 'emerald', id]); } catch(e) {}
    return this.findOne(id);
  }
}
