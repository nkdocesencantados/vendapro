import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Store) private storesRepo: Repository<Store>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'name', 'email', 'password', 'role', 'status', 'storeId'],
    });
    if (!user) throw new UnauthorizedException('Credenciais invalidas');
    if (user.status === 'blocked') throw new UnauthorizedException('Usuario bloqueado.');
    if (user.status === 'inactive') throw new UnauthorizedException('Usuario inativo.');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais invalidas');
    return user;
  }

  async login(user: User) {
    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });
    let plan = 'basic';
    if (user.storeId) {
      const storeRows = await this.storesRepo.query('SELECT plan FROM stores WHERE id = $1', [user.storeId]);
      if (storeRows?.[0]?.plan) plan = storeRows[0].plan;
    }
    const payload = { sub: user.id, email: user.email, role: user.role, storeId: user.storeId, plan };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, storeId: user.storeId, plan },
    };
  }

  async me(userId: string) {
    return this.usersRepo.findOne({ where: { id: userId } });
  }
}