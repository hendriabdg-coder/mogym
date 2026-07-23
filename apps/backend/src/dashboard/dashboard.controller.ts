import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController{
  constructor(private service:DashboardService){}
  @Get('summary')summary(@Req()r:any,@Query('programId')p:string){return this.service.summary(r.user.id,p);}
}
