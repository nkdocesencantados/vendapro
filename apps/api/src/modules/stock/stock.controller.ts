import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private service: StockService) {}

  @Get()
  findMovements(@Request() req, @Query('productId') productId?: string) {
    return this.service.findMovements(req.user.storeId, productId);
  }

  @Post('movement')
  @Roles('store_owner', 'manager')
  addMovement(@Body() body: any, @Request() req) {
    return this.service.addMovement(body, req.user.id, req.user.storeId);
  }
}
