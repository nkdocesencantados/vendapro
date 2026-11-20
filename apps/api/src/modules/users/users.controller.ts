import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  // super_admin vê qualquer loja; demais só a própria
  private scope(req: any) {
    return req.user.role === 'super_admin' ? undefined : req.user.storeId;
  }

  // sanitiza body vindo de usuário de loja: não pode trocar de loja nem virar super_admin
  // só campos editáveis passam; dono atribui seller/manager, gerente só seller (sem isso gerente virava dono)
  private sanitize(req: any, body: any) {
    if (req.user.role === 'super_admin') return body;
    const data: any = {};
    for (const k of ['name', 'email', 'phone', 'password', 'role', 'status', 'commissionRate']) if (body?.[k] !== undefined) data[k] = body[k];
    const grantable = req.user.role === 'store_owner' ? ['seller', 'manager'] : ['seller'];
    if (data.role !== undefined && !grantable.includes(data.role)) throw new ForbiddenException('Perfil nao permitido');
    return data;
  }

  // gerente não altera nem remove o dono da loja
  private async assertCanManage(req: any, id: string) {
    if (req.user.role !== 'manager') return;
    const target = await this.service.findOne(id, this.scope(req));
    if (target.role === 'store_owner') throw new ForbiddenException('Gerente nao pode alterar o proprietario');
  }

  @Get()
  findAll(@Request() req, @Query('storeId') storeId?: string) {
    const id = req.user.role === 'super_admin' ? storeId : req.user.storeId;
    return this.service.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, this.scope(req));
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    if (req.user.role === 'seller') throw new ForbiddenException('Vendedor nao pode criar usuarios');
    const data = this.sanitize(req, body);
    return this.service.create({ ...data, storeId: req.user.role === 'super_admin' ? (body.storeId || req.user.storeId) : req.user.storeId });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (req.user.role === 'seller' && id !== req.user.id) throw new ForbiddenException('Vendedor so pode alterar o proprio perfil');
    await this.assertCanManage(req, id);
    const { role: _r, status: _s, commissionRate: _c, ...own } = body || {};
    // ninguém da loja muda o próprio perfil/status/comissão (dono se rebaixando ficava sem dono; vendedor se dava comissão)
    const data = this.sanitize(req, req.user.role !== 'super_admin' && id === req.user.id ? own : body);
    return this.service.update(id, data, this.scope(req));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role === 'seller') throw new ForbiddenException('Vendedor nao pode remover usuarios');
    await this.assertCanManage(req, id);
    return this.service.remove(id, this.scope(req));
  }
}
