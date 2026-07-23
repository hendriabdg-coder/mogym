import { Body, Controller, Get, NotImplementedException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AppleAuthDto, ForgotPasswordDto, GoogleAuthDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') @Throttle({ default: { ttl: 60_000, limit: 3 } }) register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('login') @Throttle({ default: { ttl: 60_000, limit: 5 } }) login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('google') google(@Body() _: GoogleAuthDto) { throw new NotImplementedException({ message: 'Google OAuth memerlukan GOOGLE_CLIENT_ID aktif', code: 'OAUTH_NOT_CONFIGURED' }); }
  @Post('apple') apple(@Body() _: AppleAuthDto) { throw new NotImplementedException({ message: 'Apple OAuth memerlukan kredensial Apple aktif', code: 'OAUTH_NOT_CONFIGURED' }); }
  @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @Post('logout') @UseGuards(JwtAuthGuard) logout(@Req() req: any, @Body() dto: RefreshDto) { return this.auth.logout(req.user.id, dto.refreshToken); }
  @Post('logout-all') @UseGuards(JwtAuthGuard) logoutAll(@Req() req: any) { return this.auth.logoutAll(req.user.id); }
  @Get('verify-email') verify(@Query('token') token: string) { return this.auth.verifyEmail(token); }
  @Post('forgot-password') forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto); }
  @Post('reset-password') reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }
  @Get('me') @UseGuards(JwtAuthGuard) me(@Req() req: any) { return this.auth.me(req.user.id); }
}
