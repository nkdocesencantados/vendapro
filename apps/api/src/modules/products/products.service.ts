import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product, ProductStatus } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  findAll(storeId: string, search?: string) {
    const where: any = { storeId, status: ProductStatus.ACTIVE };
    if (search) where.name = Like(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string, storeId: string) {
    const product = await this.repo.findOne({ where: { id, storeId } });
    if (!product) throw new NotFoundException('Produto nao encontrado');
    return product;
  }

  create(data: Partial<Product>) {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<Product>, storeId: string) {
    const { storeId: _s, id: _i, ...safe } = data as any; // não permite mover produto de loja
    await this.findOne(id, storeId);
    await this.repo.update({ id, storeId }, safe);
    return this.findOne(id, storeId);
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    await this.repo.update(id, { status: ProductStatus.INACTIVE });
    return { message: 'Produto removido com sucesso' };
  }

  async updateStock(id: string, quantity: number, storeId: string) {
    const product = await this.findOne(id, storeId);
    await this.repo.update(id, { stock: product.stock + quantity });
    return this.findOne(id, storeId);
  }

  findLowStock(storeId: string) {
    return this.repo
      .createQueryBuilder('p')
      .where('p.storeId = :storeId', { storeId })
      .andWhere('p.stock <= p.minStock')
      .andWhere('p.status = :status', { status: ProductStatus.ACTIVE })
      .getMany();
  }
}
