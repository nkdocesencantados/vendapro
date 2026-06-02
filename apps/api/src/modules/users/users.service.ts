import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';
import { Store } from '../stores/store.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
  ) {}

  private planLimits: Record<string, number> = {
    basic: 3, trial: 1, starter: 3, pro: 5, business: 20,
    BASIC: 3, TRIAL: 1, STARTER: 3, PRO: 5, BUSINESS: 20,
  }

  async findAll(storeId?: string) {
    const where = storeId ? { storeId } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario nao encontrado');
    return user;
  }

  async create(data: Partial<User>) {
    const exists = await this.repo.findOne({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email ja cadastrado');
    if (data.storeId && data.role === 'seller') {
      const store = await this.storeRepo.findOne({ where: { id: data.storeId } });
      if (store) {
        const limit = this.planLimits[String(store.plan).toLowerCase()] ?? this.planLimits[String(store.plan)] ?? 999;
        const count = await this.repo.count({ where: { storeId: data.storeId, role: 'seller', status: UserStatus.ACTIVE } });
        if (count >= limit) {
          throw new BadRequestException('Plano ' + store.plan + ' permite no maximo ' + limit + ' vendedor(es). Faca upgrade para adicionar mais.');
        }
      }
    }
    // Hash feito pelo @BeforeInsert da entidade — não fazer hash duplo aqui
    const userData = {
      ...data,
      role: data.role || 'seller',
      commissionRate: Number(data.commissionRate) || 0,
      status: UserStatus.ACTIVE,
    };
    const user = this.repo.create(userData);
    return this.repo.save(user);
  }

  async update(id: string, data: Partial<User>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { status: UserStatus.INACTIVE });
    return { message: 'Usuario desativado com sucesso' };
  }
}
