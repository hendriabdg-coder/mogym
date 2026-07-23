import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { ConfirmProgramDto, ProfileDto, ProgramPreviewDto } from './program.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private service:OnboardingService) {}
  @Post('profile') profile(@Req() req:any,@Body() dto:ProfileDto){return this.service.saveProfile(req.user.id,dto);}
  @Post('program') program(@Req() req:any,@Body() dto:ProgramPreviewDto){return this.service.preview(req.user.id,dto);}
  @Post('confirm') confirm(@Req() req:any,@Body() dto:ConfirmProgramDto){return this.service.confirm(req.user.id,dto);}
}
