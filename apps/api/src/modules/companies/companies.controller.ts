import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common"
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger"
import { CompaniesService } from "./companies.service"
import { JwtAuthGuard } from "../auth/guards/local-auth.guard"
@ApiTags("Companies") @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller("companies")
export class CompaniesController {
  constructor(private service: CompaniesService) {}
  @Get() findAll() { return this.service.findAll() }
  @Post() create(@Body() body: any) { return this.service.create(body) }
  @Patch(":id/status") updateStatus(@Param("id") id: string, @Body() body: any) { return this.service.updateStatus(id, body.status) }
  @Delete(":id") remove(@Param("id") id: string) { return this.service.remove(id) }
  @Patch(":id/reset-password") resetPassword(@Param("id") id: string, @Body() body: any) { return this.service.resetPassword(id, body.password) }
}