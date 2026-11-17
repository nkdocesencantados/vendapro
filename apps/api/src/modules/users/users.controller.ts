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
  private sanitize(req: any, body: any) {
    if (req.user.role === 'super_admin') return body;
    const { storeId, id, ...rest } = body || {};
    if (rest.role === 'super_admin') throw new ForbiddenException('Perfil nao permitido');
    return rest;
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
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (req.user.role === 'seller' && id !== req.user.id) throw new ForbiddenException('Vendedor so pode alterar o proprio perfil');
    const data = this.sanitize(req, body);
    if (req.user.role === 'seller') { delete data.role; delete data.commissionRate; delete data.status; }
    return this.service.update(id, data, this.scope(req));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (req.user.role === 'seller') throw new ForbiddenException('Vendedor nao pode remover usuarios');
    return this.service.remove(id, this.scope(req));
  }
}
