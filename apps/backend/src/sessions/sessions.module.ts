import { Module } from '@nestjs/common';
import { ProgressiveOverloadService } from './progressive-overload.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
@Module({controllers:[SessionsController],providers:[SessionsService,ProgressiveOverloadService],exports:[ProgressiveOverloadService]})
export class SessionsModule{}
