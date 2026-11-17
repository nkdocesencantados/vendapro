import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReceivablesService } from './receivables.service';
import { PaymentDto } from './payment.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';

@ApiTags('Receivables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receivables')
export class ReceivablesController {
  constructor(private service: ReceivablesService) {}

  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.service.findAll(req.user.storeId, status);
  }

  @Get('summary')
  summary(@Request() req) {
    return this.service.summary(req.user.storeId);
  }

  @Post(':saleId/payments')
  addPayment(@Param('saleId', ParseUUIDPipe) saleId: string, @Body() body: PaymentDto, @Request() req) {
    return this.service.addPayment(saleId, body, req.user.storeId, req.user.id);
  }
}
