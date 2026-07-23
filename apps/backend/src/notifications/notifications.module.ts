import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationScheduler } from './notification.scheduler';
import { NotificationService } from './notification.service';
@Module({controllers:[NotificationController],providers:[NotificationService,NotificationScheduler],exports:[NotificationService]})
export class NotificationsModule{}
