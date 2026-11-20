import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@ApiTags('Financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financial')
export class FinancialController {
  constructor(private service: FinancialService) {}

  @Get()
  findAll(@Request() req, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.findAll(req.user.storeId, from, to);
  }

  @Get('summary')
  summary(@Request() req, @Query('month') month: string, @Query('year') year: string) {
    const now = new Date();
    return this.service.summary(
      req.user.storeId,
      parseInt(month) || now.getMonth() + 1,
      parseInt(year) || now.getFullYear(),
    );
  }

  @Post()
  @Roles('store_owner', 'manager')
  create(@Body() body: any, @Request() req) {
    const { id: _id, ...data } = body || {};
    return this.service.create({ ...data, storeId: req.user.storeId, createdById: req.user.id });
  }
}
