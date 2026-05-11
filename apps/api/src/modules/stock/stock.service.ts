import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement, MovementType } from './stock-movement.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement) private movRepo: Repository<StockMovement>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  findMovements(storeId: string, productId?: string) {
    const where: any = { storeId };
    if (productId) where.productId = productId;
    return this.movRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async addMovement(data: any, userId: string) {
    const product = await this.productRepo.findOne({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Produto nao encontrado');
    const stockBefore = product.stock;
    let stockAfter = stockBefore;
    if (data.type === MovementType.IN || data.type === MovementType.RETURN) {
      stockAfter = stockBefore + data.quantity;
    } else if (data.type === MovementType.OUT || data.type === MovementType.SALE) {
      stockAfter = stockBefore - data.quantity;
    } else {
      stockAfter = data.quantity;
    }
    await this.productRepo.update(product.id, { stock: stockAfter });
    const movement = this.movRepo.create({
      ...data, stockBefore, stockAfter, userId, storeId: product.storeId,
    });
    return this.movRepo.save(movement);
  }
}
