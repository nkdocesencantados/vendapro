import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.service.findAll(req.user.storeId, search);
  }

  @Get('low-stock')
  lowStock(@Request() req) {
    return this.service.findLowStock(req.user.storeId);
  }

  @Get(':id')
  findOne(@Param("id") id: string, @Request() req) {
    return this.service.findOne(id, req.user.storeId);
  }

  @Post()
  create(@Body() body: any, @Request() req) {
    const { id: _id, ...data } = body || {};
    return this.service.create({ ...data, storeId: req.user.storeId });
  }

  @Patch(':id')
  update(@Param("id") id: string, @Body() body: any, @Request() req) {
    return this.service.update(id, body, req.user.storeId);
  }

  @Delete(':id')
  remove(@Param("id") id: string, @Request() req) {
    return this.service.remove(id, req.user.storeId);
  }
}
