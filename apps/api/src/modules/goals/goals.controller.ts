import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { SetGoalDto } from './goal.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('goals')
export class GoalsController {
  constructor(private service: GoalsService) {}

  @Get('current')
  current(@Request() req) {
    return this.service.current(req.user.storeId);
  }

  @Put('current')
  @Roles('store_owner', 'manager')
  setCurrent(@Body() body: SetGoalDto, @Request() req) {
    return this.service.setCurrent(req.user.storeId, body.target);
  }
}
