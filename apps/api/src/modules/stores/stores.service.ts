import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private repo: Repository<Store>) {}

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const store = await this.repo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Loja nao encontrada');
    return store;
  }

  create(data: Partial<Store>) {
    const store = this.repo.create(data);
    return this.repo.save(store);
  }

  async update(id: string, data: any) {
    await this.repo.query(`UPDATE stores SET name = $1, "primaryColor" = $2 WHERE id = $3`, [data.name, data.primaryColor, id]);
    return this.findOne(id);
  }
}
