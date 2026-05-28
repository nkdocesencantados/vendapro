import { Controller, Get, UseGuards, Request, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/local-auth.guard";
@ApiTags("Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private service: ReportsService) {}
  @Get("dashboard")
  dashboard(@Request() req) {
    const sellerId = req.user.role === "seller" ? req.user.id : undefined;
    return this.service.dashboard(req.user.storeId, sellerId);
  }
  @Get("advanced")
  advanced(@Request() req, @Query("from") from: string, @Query("to") to: string) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const defaultTo = now.toISOString().split("T")[0];
    const sellerId = req.user.role === "seller" ? req.user.id : undefined;
    return this.service.advanced(req.user.storeId, from || defaultFrom, to || defaultTo, sellerId);
  }

  @Get('search')
  search(@Request() req, @Query('q') q: string) {
    return this.service.search(req.user.storeId, q)
  }

}