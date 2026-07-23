import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService, private config: ConfigService) {}

  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private publicUser(user: any) {
    const { passwordHash, emailVerifyToken, resetPasswordToken, resetPasswordExpiry, ...safe } = user;
    return safe;
  }
  private async issueTokens(user: { id: string; email: string; emailVerified: boolean }) {
    const payload = { sub: user.id, email: user.email, emailVerified: user.emailVerified };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRES_IN', '15m') as any,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d') as any,
    });
    await this.db.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400_000) },
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.db.user.findUnique({ where: { email } })) throw new ConflictException({ message: 'Email sudah terdaftar', code: 'EMAIL_EXISTS' });
    const verifyToken = randomBytes(32).toString('hex');
    await this.db.user.create({
      data: {
        name: dto.name.trim(), email, passwordHash: await argon2.hash(dto.password),
        emailVerifyToken: this.hashToken(verifyToken), profile: { create: {} }, notificationSetting: { create: { quietDays: [] } },
      },
    });
    // Integrasi SMTP mengirim tautan `${APP_URL}/verify-email?token=${verifyToken}` pada deployment.
    return { message: 'Registrasi berhasil. Periksa email untuk verifikasi.', ...(process.env.NODE_ENV === 'test' ? { verifyToken } : {}) };
  }

  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) throw new UnauthorizedException({ message: 'Email atau kata sandi salah', code: 'INVALID_CREDENTIALS' });
    if (!user.emailVerified) throw new ForbiddenException({ message: 'Verifikasi email diperlukan', code: 'EMAIL_NOT_VERIFIED' });
    return { ...(await this.issueTokens(user)), user: this.publicUser(user) };
  }

  async refresh(raw: string) {
    let payload: any;
    try { payload = await this.jwt.verifyAsync(raw, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') }); }
    catch { throw new UnauthorizedException({ message: 'Refresh token tidak valid', code: 'INVALID_REFRESH_TOKEN' }); }
    const stored = await this.db.refreshToken.findUnique({ where: { tokenHash: this.hashToken(raw) } });
    if (!stored || stored.expiresAt < new Date()) throw new UnauthorizedException({ message: 'Refresh token tidak valid', code: 'INVALID_REFRESH_TOKEN' });
    const user = await this.db.user.findUniqueOrThrow({ where: { id: payload.sub } });
    await this.db.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(user);
  }
  async logout(userId: string, raw: string) {
    await this.db.refreshToken.deleteMany({ where: { userId, tokenHash: this.hashToken(raw) } });
    return { message: 'Berhasil logout' };
  }
  async logoutAll(userId: string) { await this.db.refreshToken.deleteMany({ where: { userId } }); return { message: 'Semua sesi telah dicabut' }; }
  async verifyEmail(raw: string) {
    const user = await this.db.user.findUnique({ where: { emailVerifyToken: this.hashToken(raw) } });
    if (!user) throw new UnauthorizedException({ message: 'Token verifikasi tidak valid', code: 'INVALID_VERIFY_TOKEN' });
    await this.db.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifyToken: null } });
    return { message: 'Email berhasil diverifikasi' };
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.db.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.db.user.update({ where: { id: user.id }, data: { resetPasswordToken: this.hashToken(token), resetPasswordExpiry: new Date(Date.now() + 3600_000) } });
    }
    return { message: 'Jika email terdaftar, instruksi reset akan dikirim.' };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.db.user.findFirst({ where: { resetPasswordToken: this.hashToken(dto.token), resetPasswordExpiry: { gt: new Date() } } });
    if (!user) throw new UnauthorizedException({ message: 'Token reset tidak valid atau kedaluwarsa', code: 'INVALID_RESET_TOKEN' });
    await this.db.$transaction([
      this.db.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(dto.newPassword), resetPasswordToken: null, resetPasswordExpiry: null } }),
      this.db.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
    return { message: 'Kata sandi berhasil diubah' };
  }
  async me(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true, programs: { where: { status: 'ACTIVE' }, take: 1 } } });
    return this.publicUser(user);
  }
}
