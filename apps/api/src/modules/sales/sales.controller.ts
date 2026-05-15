import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private service: SalesService) {}
  @Get()
  findAll(@Request() req, @Query('from') from?: string, @Query('to') to?: string) {
    const sellerId = req.user.role === 'seller' ? req.user.id : undefined
    return this.service.findAll(req.user.storeId, from, to, sellerId);
  }
  @Get('today')
  todaySummary(@Request() req) {
    return this.service.todaySummary(req.user.storeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Post()
  create(@Body() body: any, @Request() req) {
    return this.service.create(body, req.user.storeId, req.user.id);
  }
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}