import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogWeightDto } from './weight.dto';
import { WeightService } from './weight.service';

@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
  constructor(private service: WeightService) {}
  @Post('log') log(@Req() req: any, @Query('programId') programId: string, @Body() dto: LogWeightDto) { return this.service.log(req.user.id, programId, dto); }
  @Get('history') history(@Req() req: any, @Query('programId') programId: string) { return this.service.history(req.user.id, programId); }
  @Get('latest') latest(@Req() req: any, @Query('programId') programId: string) { return this.service.latest(req.user.id, programId); }
}
