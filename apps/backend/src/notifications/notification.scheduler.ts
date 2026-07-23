import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationScheduler implements OnModuleInit,OnModuleDestroy{
  private worker?:Worker;private maintenance?:Queue;
  constructor(private notifications:NotificationService,private db:PrismaService){}
  async onModuleInit(){
    const connection=this.notifications.redisConnection();
    this.worker=new Worker('notification-queue',async job=>{
      if(job.name==='SCHEDULE_ALL_USERS')return this.scheduleAll();
      return this.notifications.send(job.data.notificationLogId);
    },{connection,concurrency:10});
    this.maintenance=new Queue('notification-maintenance',{connection});
    await this.maintenance.upsertJobScheduler('weekly-notification-reschedule',{every:7*24*3600_000},{name:'SCHEDULE_ALL_USERS',data:{},opts:{removeOnComplete:10}});
    const maintenanceWorker=new Worker('notification-maintenance',async()=>this.scheduleAll(),{connection});
    this.worker.on('closed',()=>maintenanceWorker.close());
  }
  async onModuleDestroy(){await this.worker?.close();await this.maintenance?.close();}
  private async scheduleAll(){const users=await this.db.notificationSetting.findMany({select:{userId:true}});for(const u of users)await this.notifications.scheduleUserWeek(u.userId);return{users:users.length};}
}
