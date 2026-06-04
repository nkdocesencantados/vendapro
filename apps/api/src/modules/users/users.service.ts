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
    basic: 0, trial: 0, starter: 0, pro: 1, business: 10,
    BASIC: 0, TRIAL: 0, STARTER: 0, PRO: 1, BUSINESS: 10,
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
    // Usar query raw para evitar falha em colunas que podem não existir ainda no banco
    const id = require('crypto').randomUUID();
    const hashedPw = await require('bcryptjs').hash(data.password || '123456', 12);
    await this.repo.query(
      `INSERT INTO users (id, name, email, password, role, status, "storeId", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'active',$6,NOW(),NOW())`,
      [id, data.name, data.email, hashedPw, data.role || 'seller', data.storeId || null]
    );
    return this.repo.findOne({ where: { id } });
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
