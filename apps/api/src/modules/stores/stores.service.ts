import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private repo: Repository<Store>) {}

  async findAll() {
    return this.repo.query(`SELECT id, name, "primaryColor", phone, email, segment, "monthlyGoal" FROM stores ORDER BY "createdAt" DESC`);
  }

  async findOne(id: string) {
    const r = await this.repo.query(`SELECT id, name, "primaryColor", phone, email, segment, "monthlyGoal" FROM stores WHERE id = $1`, [id]);
    if (!r || r.length === 0) throw new NotFoundException('Loja nao encontrada');
    return r[0];
  }

  async create(data: Partial<Store>) {
    const store = this.repo.create(data);
    return this.repo.save(store);
  }

  async update(id: string, data: any) {
    await this.repo.query(`UPDATE stores SET name = $1, "primaryColor" = $2 WHERE id = $3`, [data.name, data.primaryColor, id]);
    return this.findOne(id);
  }
}