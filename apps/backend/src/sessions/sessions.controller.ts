import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogSessionDto, MissSessionDto, RescheduleDto } from './session.dto';
import { ProgressiveOverloadService } from './progressive-overload.service';
import { SessionsService } from './sessions.service';
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private sessions:SessionsService,private overload:ProgressiveOverloadService){}
  @Get('today') today(@Req() r:any){return this.sessions.today(r.user.id);}
  @Get('history') history(@Req() r:any,@Query() q:any){return this.sessions.history(r.user.id,q);}
  @Get('upcoming') upcoming(@Req() r:any,@Query('programId') p:string,@Query('days') d?:string){return this.sessions.upcoming(r.user.id,p,Number(d)||14);}
  @Get('progressive-overload/:exerciseId') rec(@Req() r:any,@Param('exerciseId') e:string,@Query('programId') p:string){return this.overload.getRecommendation(e,r.user.id,p);}
  @Get(':id') detail(@Req() r:any,@Param('id') id:string){return this.sessions.detail(id,r.user.id);}
  @Post(':id/start') start(@Req() r:any,@Param('id') id:string){return this.sessions.start(id,r.user.id);}
  @Post(':id/log') log(@Req() r:any,@Param('id') id:string,@Body() dto:LogSessionDto){return this.sessions.log(id,r.user.id,dto);}
  @Post(':id/miss') miss(@Req() r:any,@Param('id') id:string,@Body() dto:MissSessionDto){return this.sessions.miss(id,r.user.id,dto.reason);}
  @Get(':id/reschedule-options') options(@Req() r:any,@Param('id') id:string){return this.sessions.options(id,r.user.id);}
  @Post(':id/reschedule') reschedule(@Req() r:any,@Param('id') id:string,@Body() dto:RescheduleDto){return this.sessions.reschedule(id,r.user.id,dto);}
}
