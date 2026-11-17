import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Get()
  findAll(@Request() req, @Query('search') search?: string, @Query('filter') filter?: string) {
    return this.service.findAll(req.user.storeId, search, filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.service.findOne(id, req.user.storeId);
  }

  @Post()
  create(@Body() body: CreateCustomerDto, @Request() req) {
    return this.service.create(body, req.user.storeId);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCustomerDto, @Request() req) {
    return this.service.update(id, body, req.user.storeId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.service.remove(id, req.user.storeId);
  }
}
