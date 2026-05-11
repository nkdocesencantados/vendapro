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

  async findOne(id: string) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produto nao encontrado');
    return product;
  }

  create(data: Partial<Product>) {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<Product>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: ProductStatus.INACTIVE });
    return { message: 'Produto removido com sucesso' };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id);
    await this.repo.update(id, { stock: product.stock + quantity });
    return this.findOne(id);
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
