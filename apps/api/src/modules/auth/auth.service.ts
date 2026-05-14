import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
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
    const payload = { sub: user.id, email: user.email, role: user.role, storeId: user.storeId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, storeId: user.storeId },
    };
  }

  async me(userId: string) {
    return this.usersRepo.findOne({ where: { id: userId } });
  }
}