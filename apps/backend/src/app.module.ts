import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgramsModule } from './programs/programs.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProgressModule } from './progress/progress.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OptionalModule } from './optional/optional.module';
import { HealthController } from './health.controller';

@Module({
  controllers:[HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    ProgramsModule,
    SessionsModule,
    ProgressModule,
    DashboardModule,
    NotificationsModule,
    OptionalModule,
  ],
})
export class AppModule {}
