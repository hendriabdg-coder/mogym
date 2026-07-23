import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';
import { Queue } from 'bullmq';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationSettingsDto, SubscribeDto } from './notification.dto';

@Injectable()
export class NotificationService implements OnModuleInit {
  private queue: Queue;
  constructor(private db:PrismaService,private config:ConfigService){
    this.queue=new Queue('notification-queue',{connection:this.redisConnection()});
  }
  onModuleInit(){
    const pub=this.config.get('VAPID_PUBLIC_KEY'),priv=this.config.get('VAPID_PRIVATE_KEY'),email=this.config.get('VAPID_EMAIL');
    if(pub&&priv&&email)webpush.setVapidDetails(email,pub,priv);
  }
  redisConnection(){
    const url=new URL(this.config.get('REDIS_URL','redis://localhost:6379'));
    return{host:url.hostname,port:Number(url.port)||6379,password:url.password||undefined};
  }
  subscribe(userId:string,dto:SubscribeDto){return this.db.pushSubscription.upsert({where:{endpoint:dto.endpoint},update:{userId,p256dh:dto.p256dh,auth:dto.auth,userAgent:dto.userAgent},create:{userId,...dto}});}
  unsubscribe(userId:string,endpoint:string){return this.db.pushSubscription.deleteMany({where:{userId,endpoint}});}
  async settings(userId:string){return this.db.notificationSetting.upsert({where:{userId},update:{},create:{userId,quietDays:[]}});}
  async updateSettings(userId:string,dto:NotificationSettingsDto){
    if(dto.quietDays?.some(d=>!Number.isInteger(d)||d<0||d>6))throw new BadRequestException('quietDays harus 0-6');
    const setting=await this.db.notificationSetting.upsert({where:{userId},update:dto,create:{userId,quietDays:dto.quietDays||[],...dto}});
    await this.scheduleUserWeek(userId);return setting;
  }
  history(userId:string,limit=20,offset=0){return this.db.notificationLog.findMany({where:{userId},take:Math.min(100,Math.max(1,limit)),skip:Math.max(0,offset),orderBy:{scheduledAt:'desc'}});}
  async scheduleUserWeek(userId:string){
    const setting=await this.settings(userId);const program=await this.db.cuttingProgram.findFirst({where:{userId,status:'ACTIVE'}});
    if(!program)return{scheduled:0};
    const sessions=await this.db.workoutSession.findMany({where:{userId,programId:program.id,status:{in:['SCHEDULED','RESCHEDULED']},scheduledDate:{gte:new Date(),lte:new Date(Date.now()+7*864e5)}},include:{split:{include:{exercises:true}}}});
    const oldLogs=await this.db.notificationLog.findMany({where:{userId,sentAt:null,scheduledAt:{gte:new Date()}},select:{id:true}});
    await Promise.all(oldLogs.map(l=>this.queue.remove(`user-${userId}-${l.id}`)));
    await this.db.notificationLog.deleteMany({where:{id:{in:oldLogs.map(x=>x.id)}}});
    let scheduled=0;
    for(const session of sessions){
      if(setting.quietDays.includes(session.scheduledDate.getDay()))continue;
      const at=new Date(session.scheduledDate);at.setHours(setting.workoutReminderHour,setting.workoutReminderMinute,0,0);
      if(setting.workoutReminder){await this.addJob(userId,'WORKOUT_REMINDER',at,{sessionId:session.id,sessionType:session.split.splitType,exerciseCount:session.split.exercises.length});scheduled++;}
      if(setting.postWorkoutReminder){await this.addJob(userId,'POST_WORKOUT',new Date(at.getTime()+30*60_000),{sessionId:session.id,sessionType:session.split.splitType});scheduled++;}
      if(setting.missedSessionReminder){await this.addJob(userId,'MISSED_SESSION',new Date(at.getTime()+2*3600_000),{sessionId:session.id,sessionType:session.split.splitType});scheduled++;}
    }
    const nextSeven=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()+i+1);return d;});
    const weighDay=nextSeven.find(d=>d.getDay()===0&&!setting.quietDays.includes(0));
    if(setting.weighReminder&&weighDay){weighDay.setHours(setting.weighReminderHour,setting.weighReminderMinute,0,0);await this.addJob(userId,'WEIGH_REMINDER',weighDay,{programId:program.id});scheduled++;}
    const evaluationDay=nextSeven.find(d=>d.getDay()===0&&!setting.quietDays.includes(0));
    if(setting.evaluationReminder&&evaluationDay){evaluationDay.setHours(20,0,0,0);const weekNumber=Math.max(1,Math.floor((evaluationDay.getTime()-program.startDate.getTime())/6048e5)+1);await this.addJob(userId,'EVALUATION',evaluationDay,{programId:program.id,weekNumber});scheduled++;}
    if(setting.foodChecklistReminder&&program.foodChecklistEnabled){
      for(const day of nextSeven.filter(d=>!setting.quietDays.includes(d.getDay()))){day.setHours(19,0,0,0);await this.addJob(userId,'FOOD_CHECKLIST',day,{programId:program.id,date:day.toISOString().slice(0,10)});scheduled++;}
    }
    return{scheduled};
  }
  async addJob(userId:string,type:NotificationType,at:Date,payload:any){
    if(at<=new Date())return;
    const log=await this.db.notificationLog.create({data:{userId,type,scheduledAt:at,payload}});
    await this.queue.add(type,{notificationLogId:log.id},{jobId:`user-${userId}-${log.id}`,delay:Math.max(0,at.getTime()-Date.now()),removeOnComplete:500,removeOnFail:1000});
  }
  async send(logId:string){
    const log=await this.db.notificationLog.findUnique({where:{id:logId}});
    if(!log||log.sentAt||!(await this.shouldSend(log)))return;
    const subscriptions=await this.db.pushSubscription.findMany({where:{userId:log.userId}});
    const payload=log.payload as any;const message=this.message(log.type,payload);
    await Promise.all(subscriptions.map(async sub=>{
      try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({type:log.type,...message,data:payload}));}
      catch(e:any){if(e.statusCode===404||e.statusCode===410)await this.db.pushSubscription.delete({where:{id:sub.id}});}
    }));
    await this.db.notificationLog.update({where:{id:log.id},data:{sentAt:new Date()}});
  }
  private async shouldSend(log:any){
    const p=log.payload as any;const setting=await this.settings(log.userId);
    if(setting.quietDays.includes(new Date(log.scheduledAt).getDay()))return false;
    if(p.sessionId){const s=await this.db.workoutSession.findFirst({where:{id:p.sessionId,userId:log.userId}});if(!s)return false;
      if(['COMPLETED','SKIPPED'].includes(s.status))return false;
      if(log.type==='MISSED_SESSION'&&s.status==='IN_PROGRESS')return false;
    }
    if(log.type==='WEIGH_REMINDER'){const start=new Date(log.scheduledAt);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);if(await this.db.weeklyWeight.findFirst({where:{userId:log.userId,weighDate:{gte:start,lt:end}}}))return false;}
    if(log.type==='FOOD_CHECKLIST'){const start=new Date(log.scheduledAt);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);const list=await this.db.foodChecklist.findFirst({where:{userId:log.userId,date:{gte:start,lt:end}}});if(list&&(list.items as any[]).every(x=>x.consumed))return false;}
    return true;
  }
  private message(type:NotificationType,p:any){
    const map:any={
      WORKOUT_REMINDER:{title:'Latihan hari ini',body:`${p.sessionType}. ${p.exerciseCount} latihan menanti. Mulai sekarang?`},
      POST_WORKOUT:{title:'Catat latihan',body:'Sesi latihan kamu belum dicatat. Catat sekarang agar progres tersimpan.'},
      WEIGH_REMINDER:{title:'Waktunya timbang badan!',body:'Timbang sebelum makan untuk akurasi terbaik.'},
      MISSED_SESSION:{title:'Sesi belum selesai',body:`Sesi ${p.sessionType} belum diselesaikan. Mau dijadwal ulang?`},
      EVALUATION:{title:'Evaluasi mingguan siap',body:`Evaluasi minggu ${p.weekNumber} sudah siap. Cek progres kamu sekarang.`},
      FOOD_CHECKLIST:{title:'Checklist makanan',body:'Checklist makanan hari ini belum lengkap.'},
    };return map[type];
  }
}
