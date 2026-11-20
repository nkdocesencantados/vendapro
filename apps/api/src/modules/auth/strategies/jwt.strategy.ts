import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/user.entity';

// No hardcoded fallback: a known default secret would let anyone forge tokens.
export function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectRepository(User) private users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }
  // relê o usuário a cada requisição: removido/bloqueado perde acesso na hora e role/storeId vêm do banco, não do token
  async validate(payload: any) {
    const u = await this.users.findOne({ where: { id: payload.sub }, select: ['id', 'email', 'role', 'status', 'storeId'] });
    if (!u || u.status === 'blocked' || u.status === 'inactive') throw new UnauthorizedException('Sessao invalida');
    // sem storeId os filtros { storeId } do TypeORM são ignorados e a consulta veria todas as lojas
    if (u.role !== 'super_admin' && !u.storeId) throw new UnauthorizedException('Usuario sem loja vinculada');
    return { id: u.id, email: u.email, role: u.role, storeId: u.storeId, plan: payload.plan || 'basic' };
  }
}
