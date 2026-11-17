import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

// usuário de loja só acessa a própria loja; super_admin acessa qualquer uma
function assertOwnStore(req: any, id: string) {
  if (req.user.role !== 'super_admin' && req.user.storeId !== id) throw new ForbiddenException('Acesso negado a esta loja');
}

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(private service: StoresService) {}

  @Get()
  findAll(@Request() req) {
    if (req.user.role === 'super_admin') return this.service.findAll();
    if (!req.user.storeId) return null;
    return this.service.findOne(req.user.storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    assertOwnStore(req, id);
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Request() req) {
    assertOwnStore(req, id);
    if (req.user.role === 'seller') throw new ForbiddenException('Vendedor nao pode alterar a loja');
    return this.service.update(id, body);
  }
}
