import { Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationSettingsDto, SubscribeDto, UnsubscribeDto } from './notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private service:NotificationService){}
  @Post('subscribe')subscribe(@Req()r:any,@Body()dto:SubscribeDto){return this.service.subscribe(r.user.id,dto);}
  @Delete('subscribe')unsubscribe(@Req()r:any,@Body()dto:UnsubscribeDto){return this.service.unsubscribe(r.user.id,dto.endpoint);}
  @Put('settings')update(@Req()r:any,@Body()dto:NotificationSettingsDto){return this.service.updateSettings(r.user.id,dto);}
  @Get('settings')settings(@Req()r:any){return this.service.settings(r.user.id);}
  @Get()history(@Req()r:any,@Query('limit')l?:string,@Query('offset')o?:string){return this.service.history(r.user.id,Number(l)||20,Number(o)||0);}
}
