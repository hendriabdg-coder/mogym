import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaveFoodChecklistDto, ToggleFoodItemDto } from './food-checklist.dto';
import { FoodChecklistService } from './food-checklist.service';
@Controller('food-checklist')
@UseGuards(JwtAuthGuard)
export class FoodChecklistController {
  constructor(private service:FoodChecklistService){}
  @Get('today')today(@Req()r:any){return this.service.today(r.user.id);}
  @Post('today')save(@Req()r:any,@Body()dto:SaveFoodChecklistDto){return this.service.save(r.user.id,dto);}
  @Put('today/item/:itemId')toggle(@Req()r:any,@Param('itemId')id:string,@Body()dto:ToggleFoodItemDto){return this.service.toggle(r.user.id,id,dto.consumed);}
  @Post('copy-yesterday')copy(@Req()r:any){return this.service.copyYesterday(r.user.id);}
}
