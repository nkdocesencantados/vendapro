import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

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
    const user = this.repo.create({ ...data, status: UserStatus.ACTIVE });
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
