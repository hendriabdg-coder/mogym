import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private db:PrismaService){}
  async summary(userId:string,programId:string){
    const program=await this.db.cuttingProgram.findFirst({where:{id:programId,userId}});
    if(!program)throw new NotFoundException('Program tidak ditemukan');
    const now=new Date();const currentWeek=Math.max(1,Math.floor((now.getTime()-program.startDate.getTime())/6048e5)+1);
    const weekStart=new Date(program.startDate);weekStart.setDate(weekStart.getDate()+(currentWeek-1)*7);const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+7);
    const [sessions,weights,evaluations,todaySession,nextSession]=await Promise.all([
      this.db.workoutSession.findMany({where:{programId,userId},include:{logs:true,split:true},orderBy:{scheduledDate:'asc'}}),
      this.db.weeklyWeight.findMany({where:{programId,userId},orderBy:{weighDate:'asc'}}),
      this.db.weeklyEvaluation.findMany({where:{programId,userId},orderBy:{weekNumber:'asc'}}),
      this.today(userId,programId),
      this.db.workoutSession.findFirst({where:{programId,userId,status:'SCHEDULED',scheduledDate:{gt:now}},orderBy:{scheduledDate:'asc'},include:{split:true}}),
    ]);
    const thisWeek=sessions.filter(s=>s.scheduledDate>=weekStart&&s.scheduledDate<weekEnd);
    const completed=thisWeek.filter(s=>s.status==='COMPLETED');
    const allCompleted=sessions.filter(s=>s.status==='COMPLETED');
    const rpes=allCompleted.map(s=>s.averageRpe).filter((x):x is number=>x!=null);
    const latestWeight=weights.at(-1);
    const volumeByWeek=new Map<number,number>();
    sessions.forEach(s=>{if(s.status!=='COMPLETED')return;const week=Math.max(1,Math.floor((s.scheduledDate.getTime()-program.startDate.getTime())/6048e5)+1);const volume=s.logs.reduce((a,l)=>a+(l.sets as any[]).reduce((b,x)=>b+(Number(x.weightKg)||0)*(Number(x.reps)||0),0),0);volumeByWeek.set(week,(volumeByWeek.get(week)||0)+volume);});
    const data={
      program:{...program,currentWeek,daysRemaining:Math.max(0,Math.ceil((program.targetDate.getTime()-now.getTime())/864e5))},
      today:todaySession?{session:todaySession,restDay:false,nextSession}:{restDay:true,nextSession},
      thisWeek:{planned:thisWeek.length,completed:completed.length,missed:thisWeek.filter(s=>s.status==='MISSED').length,compliancePercent:thisWeek.length?Math.round(completed.length/thisWeek.length*100):0},
      weight:{initial:program.startWeight,current:latestWeight?.weightKg??program.currentWeight,target:program.targetWeight,change:Number(((latestWeight?.weightKg??program.currentWeight)-program.startWeight).toFixed(2)),remaining:program.targetWeight==null?null:Number(((latestWeight?.weightKg??program.currentWeight)-program.targetWeight).toFixed(2)),lastWeighed:latestWeight?.weighDate??null},
      performance:{averageRpe:rpes.length?Number((rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1)):null,totalSessions:allCompleted.length,trend:this.performanceTrend(allCompleted)},
      nutrition:{calories:program.caloricTarget,protein:program.proteinGrams,carbs:program.carbsGrams,fat:program.fatGrams},
      latestEvaluation:evaluations.at(-1)??null,
      charts:{
        weightHistory:weights.map(w=>({week:w.weekNumber,weight:w.weightKg,date:w.weighDate})),
        complianceHistory:evaluations.map(e=>({week:e.weekNumber,percent:e.compliancePercent})),
        volumeHistory:[...volumeByWeek.entries()].sort((a,b)=>a[0]-b[0]).map(([week,totalVolume])=>({week,totalVolume:Number(totalVolume.toFixed(1))})),
      },
    };
    return{...data,insights:this.generateInsights(data)};
  }
  generateInsights(data:any):string[]{
    const insights:string[]=[];
    if(data.weight.lastWeighed==null)insights.push('Kamu belum mencatat berat badan. Timbang pagi hari sebelum makan untuk hasil yang konsisten.');
    else if(data.weight.change<0&&data.performance.trend!=='DOWN')insights.push(`Berat badan turun ${Math.abs(data.weight.change)} kg dan performa latihan tetap stabil.`);
    if(data.thisWeek.compliancePercent<60)insights.push(`Kepatuhan latihan minggu ini ${data.thisWeek.compliancePercent}%. Selesaikan minimal 2 sesi sebelum mengubah kalori.`);
    if(data.latestEvaluation?.status==='FATIGUE')insights.push('Tanda kelelahan terdeteksi. Pertimbangkan recovery week dan jangan kurangi kalori saat ini.');
    if(!insights.length)insights.push('Program berjalan sesuai rencana. Pertahankan konsistensi minggu ini.');
    return insights;
  }
  private async today(userId:string,programId:string){const s=new Date();s.setHours(0,0,0,0);const e=new Date(s);e.setDate(e.getDate()+1);return this.db.workoutSession.findFirst({where:{userId,programId,scheduledDate:{gte:s,lt:e}},include:{split:true}});}
  private performanceTrend(sessions:any[]){if(sessions.length<4)return'STABLE';const mid=Math.floor(sessions.length/2);const a=sessions.slice(0,mid).reduce((x,s)=>x+(s.averageRpe||0),0)/mid;const b=sessions.slice(mid).reduce((x,s)=>x+(s.averageRpe||0),0)/(sessions.length-mid);return b>a+1?'DOWN':b<a-1?'UP':'STABLE';}
}
