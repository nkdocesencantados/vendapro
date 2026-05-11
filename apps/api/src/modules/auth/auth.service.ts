import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserStatus } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: ['id','name','email','password','role','status','storeId','permissions'],
    });
    if (!user) throw new UnauthorizedException('Credenciais invalidas');
    if (user.status === UserStatus.BLOCKED) throw new UnauthorizedException('Usuario bloqueado.');
    if (user.status === UserStatus.INACTIVE) throw new UnauthorizedException('Usuario inativo.');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais invalidas');
    return user;
  }

  async login(user: User) {
    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });
    const payload = { sub: user.id, email: user.email, role: user.role, storeId: user.storeId };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, storeId: user.storeId, permissions: user.permissions },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await this.usersRepo.update(user.id, { resetPasswordToken: token, resetPasswordExpires: expires });
    console.log(`[DEV] Token de reset: ${token}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { resetPasswordToken: token } });
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token invalido ou expirado');
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(user.id, { password: hashed, resetPasswordToken: null, resetPasswordExpires: null });
  }

  async me(userId: string) {
    return this.usersRepo.findOne({ where: { id: userId } });
  }
}
