import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogSessionDto, RescheduleDto, RescheduleOption } from './session.dto';
@Injectable()
export class SessionsService {
  constructor(private db:PrismaService){}
  private async owned(id:string,userId:string){
    const row=await this.db.workoutSession.findFirst({where:{id,userId},include:{split:{include:{exercises:{include:{exercise:true},orderBy:{orderIndex:'asc'}}}},logs:true}});
    if(!row)throw new NotFoundException('Sesi tidak ditemukan'); return row;
  }
  async today(userId:string){
    const start=new Date();start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);
    const session=await this.db.workoutSession.findFirst({where:{userId,scheduledDate:{gte:start,lt:end},status:{in:['SCHEDULED','IN_PROGRESS']}},include:{split:true}});
    if(session)return session;
    const nextSession=await this.db.workoutSession.findFirst({where:{userId,scheduledDate:{gte:end},status:'SCHEDULED'},orderBy:{scheduledDate:'asc'},include:{split:true}});
    return{restDay:true,nextSession};
  }
  detail(id:string,userId:string){return this.owned(id,userId);}
  async start(id:string,userId:string){
    const s=await this.owned(id,userId);if(!['SCHEDULED','RESCHEDULED'].includes(s.status))throw new BadRequestException('Sesi tidak dapat dimulai');
    return this.db.workoutSession.update({where:{id},data:{status:'IN_PROGRESS',actualDate:new Date()}});
  }
  async log(id:string,userId:string,dto:LogSessionDto){
    const s=await this.owned(id,userId);if(!['IN_PROGRESS','SCHEDULED'].includes(s.status))throw new BadRequestException('Sesi tidak dapat dicatat');
    const allowed=new Set(s.split.exercises.map(x=>x.exerciseId));
    if(dto.exercises.some(x=>!allowed.has(x.exerciseId)))throw new BadRequestException('Latihan bukan bagian dari sesi');
    const warning=/nyeri tajam|pusing|sesak/i.test(`${dto.notes||''} ${dto.exercises.map(x=>x.notes).join(' ')}`)
      ?'Kamu menyebut rasa sakit yang mungkin perlu perhatian. Hentikan latihan jika diperlukan dan konsultasikan dengan tenaga kesehatan.':undefined;
    await this.db.$transaction([
      this.db.sessionExerciseLog.deleteMany({where:{sessionId:id}}),
      ...dto.exercises.map((x,i)=>this.db.sessionExerciseLog.create({data:{sessionId:id,exerciseId:x.exerciseId,orderIndex:i,sets:x.sets as any,rpe:x.rpe,notes:x.notes}})),
      this.db.workoutSession.update({where:{id},data:{status:'COMPLETED',actualDate:s.actualDate||new Date(),durationMinutes:dto.durationMinutes,averageRpe:dto.averageRpe,notes:dto.notes}}),
    ]);
    return{sessionId:id,status:'COMPLETED',warning};
  }
  async miss(id:string,userId:string,reason?:string){await this.owned(id,userId);return this.db.workoutSession.update({where:{id},data:{status:'MISSED',notes:reason}});}
  async options(id:string,userId:string){
    const s=await this.owned(id,userId);const program=await this.db.cuttingProgram.findUniqueOrThrow({where:{id:s.programId}});
    const busy=await this.db.workoutSession.findMany({where:{userId,programId:s.programId,scheduledDate:{gte:new Date(),lte:new Date(Date.now()+7*864e5)},status:{notIn:['MISSED','SKIPPED']}},select:{scheduledDate:true}});
    const busyDays=new Set(busy.map(x=>x.scheduledDate.toISOString().slice(0,10)));const dates=[];
    for(let i=1;i<=7;i++){const d=new Date();d.setDate(d.getDate()+i);if(!program.unavailableDays.includes(d.getDay())&&!busyDays.has(d.toISOString().slice(0,10)))dates.push(d);}
    return{nextEmpty:dates,canSwapRest:dates.length>0,canSkip:true,canRebuildWeek:true};
  }
  async reschedule(id:string,userId:string,dto:RescheduleDto){
    await this.owned(id,userId);
    if(dto.option===RescheduleOption.SKIP)return this.db.workoutSession.update({where:{id},data:{status:'SKIPPED'}});
    const options=await this.options(id,userId);const target=dto.targetDate?new Date(dto.targetDate):options.nextEmpty[0];
    if(!target)throw new BadRequestException('Tidak ada tanggal pengganti yang valid');
    return this.db.workoutSession.update({where:{id},data:{status:'RESCHEDULED',scheduledDate:target}});
  }
  history(userId:string,q:any){
    const limit=Math.min(100,Math.max(1,Number(q.limit)||20)),offset=Math.max(0,Number(q.offset)||0);
    return this.db.workoutSession.findMany({where:{userId,...(q.programId?{programId:q.programId}:{}),...(q.from||q.to?{scheduledDate:{...(q.from?{gte:new Date(q.from)}:{}),...(q.to?{lte:new Date(q.to)}:{})}}:{})},take:limit,skip:offset,orderBy:{scheduledDate:'desc'},include:{split:true}});
  }
  upcoming(userId:string,programId:string,days=14){return this.db.workoutSession.findMany({where:{userId,programId,scheduledDate:{gte:new Date(),lte:new Date(Date.now()+Math.min(60,days)*864e5)}},orderBy:{scheduledDate:'asc'},include:{split:true}});}
}
