import { Injectable, NotFoundException } from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type EvaluationMetrics = {
  plannedSessions: number; completedSessions: number; missedSessions: number;
  compliancePercent: number; averageRpe: number | null; weightChange: number | null;
  previousWeightChanges: number[]; previousAverageRpe: number[]; volumeChangePercent: number | null;
  hasComplaintsOfPain: boolean;
};

@Injectable()
export class WeeklyEvaluationService {
  constructor(private db: PrismaService) {}

  determineStatus(data: EvaluationMetrics): EvaluationStatus {
    if (data.completedSessions < 2 || data.weightChange == null) return 'INSUFFICIENT_DATA';
    if (data.averageRpe != null && data.averageRpe > 8.5 && data.previousAverageRpe[0] > 8.5 && data.missedSessions > 0) return 'FATIGUE';
    if (data.volumeChangePercent != null && data.volumeChangePercent < -10) return 'PERFORMANCE_DROP';
    if (data.compliancePercent < 60) return 'LOW_COMPLIANCE';
    if (Math.abs(data.weightChange) < 0.1 && data.previousWeightChanges.slice(0, 1).every((x) => Math.abs(x) < 0.1)) return 'STAGNANT';
    if (data.weightChange < -1.05) return 'AHEAD';
    if (data.weightChange <= -0.25) return 'ON_TRACK';
    return 'BEHIND';
  }

  recommendations(status: EvaluationStatus): string[] {
    const map: Record<EvaluationStatus, string[]> = {
      ON_TRACK:['Pertahankan program minggu depan.'],
      AHEAD:['Progres sangat baik. Pastikan asupan protein tetap terjaga.'],
      BEHIND:['Tingkatkan kepatuhan latihan terlebih dahulu.','Pertimbangkan pengurangan kalori 100–200 kkal/hari setelah dikonfirmasi.'],
      STAGNANT:['Berat stagnan selama 2 minggu. Periksa konsistensi pola makan.','Pertimbangkan pengurangan kalori 200 kkal/hari setelah dikonfirmasi.'],
      FATIGUE:['Tanda-tanda kelelahan terdeteksi. Pertimbangkan recovery week.','Jangan kurangi kalori saat ini.'],
      PERFORMANCE_DROP:['Performa menurun. Pertahankan beban latihan.','Jangan kurangi kalori sampai performa stabil.'],
      LOW_COMPLIANCE:['Prioritas: selesaikan latihan yang direncanakan dulu.','Tunda perubahan program sampai kepatuhan di atas 80%.'],
      INSUFFICIENT_DATA:['Selesaikan minimal 2 sesi dan 1 kali timbang agar evaluasi akurat.'],
      CONSIDER_RECOVERY:['Pertimbangkan recovery week setelah dikonfirmasi.'],
      CONSIDER_CALORIC_ADJUSTMENT:['Pertimbangkan penyesuaian kalori setelah dikonfirmasi.'],
    };
    return map[status];
  }

  async generateEvaluation(programId: string, weekNumber: number, userId?: string) {
    const program = await this.db.cuttingProgram.findFirst({ where: { id: programId, ...(userId ? { userId } : {}) } });
    if (!program) throw new NotFoundException('Program tidak ditemukan');
    const metrics = await this.collect(programId, weekNumber);
    const status = this.determineStatus(metrics);
    const evaluation=await this.db.weeklyEvaluation.upsert({
      where: { programId_weekNumber: { programId, weekNumber } },
      update: {
        status, completedSessions:metrics.completedSessions, plannedSessions:metrics.plannedSessions,
        missedSessions:metrics.missedSessions, compliancePercent:metrics.compliancePercent,
        averageRpe:metrics.averageRpe, weightChange:metrics.weightChange, recommendations:this.recommendations(status),
      },
      create: {
        programId,userId:program.userId,weekNumber,status,completedSessions:metrics.completedSessions,
        plannedSessions:metrics.plannedSessions,missedSessions:metrics.missedSessions,
        compliancePercent:metrics.compliancePercent,averageRpe:metrics.averageRpe,
        weightChange:metrics.weightChange,recommendations:this.recommendations(status),
      },
    });
    if(status!=='INSUFFICIENT_DATA'&&await this.shouldRecommendDeload(programId)){
      return this.db.weeklyEvaluation.update({where:{id:evaluation.id},data:{status:'CONSIDER_RECOVERY',recommendations:this.recommendations('CONSIDER_RECOVERY')}});
    }
    return evaluation;
  }

  async collect(programId:string,weekNumber:number):Promise<EvaluationMetrics>{
    const program=await this.db.cuttingProgram.findUniqueOrThrow({where:{id:programId}});
    const start=new Date(program.startDate);start.setDate(start.getDate()+(weekNumber-1)*7);
    const end=new Date(start);end.setDate(end.getDate()+7);
    const sessions=await this.db.workoutSession.findMany({where:{programId,scheduledDate:{gte:start,lt:end}},include:{logs:true}});
    const weights=await this.db.weeklyWeight.findMany({where:{programId,weighDate:{gte:start,lt:end}},orderBy:{weighDate:'asc'}});
    const previous=weekNumber>1?await this.db.weeklyEvaluation.findMany({where:{programId,weekNumber:{lt:weekNumber}},orderBy:{weekNumber:'desc'},take:3}):[];
    const completed=sessions.filter(s=>s.status==='COMPLETED');
    const rpes=completed.flatMap(s=>[s.averageRpe,...s.logs.map(l=>l.rpe)].filter((x):x is number=>x!=null));
    const currentVolume=completed.reduce((sum,s)=>sum+s.logs.reduce((ls,l)=>ls+(l.sets as any[]).reduce((a,x)=>a+(Number(x.weightKg)||0)*(Number(x.reps)||0),0),0),0);
    const previousVolume=await this.volumeForWeek(programId,weekNumber-1);
    return{
      plannedSessions:sessions.length,completedSessions:completed.length,missedSessions:sessions.filter(s=>s.status==='MISSED').length,
      compliancePercent:sessions.length?Math.round(completed.length/sessions.length*100):0,
      averageRpe:rpes.length?Number((rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1)):null,
      weightChange:weights.length?Number((weights[weights.length-1].weightKg-(weights[0]?.weightKg??weights[weights.length-1].weightKg)).toFixed(2)):null,
      previousWeightChanges:previous.map(x=>x.weightChange??0),previousAverageRpe:previous.map(x=>x.averageRpe??0),
      volumeChangePercent:previousVolume>0?Number(((currentVolume-previousVolume)/previousVolume*100).toFixed(1)):null,
      hasComplaintsOfPain:sessions.some(s=>/nyeri|sakit|pusing|sesak/i.test(s.notes||'')||s.logs.some(l=>/nyeri|sakit/i.test(l.notes||''))),
    };
  }
  private async volumeForWeek(programId:string,weekNumber:number){
    if(weekNumber<1)return 0;const p=await this.db.cuttingProgram.findUniqueOrThrow({where:{id:programId}});
    const start=new Date(p.startDate);start.setDate(start.getDate()+(weekNumber-1)*7);const end=new Date(start);end.setDate(end.getDate()+7);
    const logs=await this.db.sessionExerciseLog.findMany({where:{session:{programId,scheduledDate:{gte:start,lt:end},status:'COMPLETED'}}});
    return logs.reduce((sum,l)=>sum+(l.sets as any[]).reduce((a,x)=>a+(Number(x.weightKg)||0)*(Number(x.reps)||0),0),0);
  }
  async shouldRecommendDeload(programId:string):Promise<boolean>{
    const program=await this.db.cuttingProgram.findUniqueOrThrow({where:{id:programId}});
    const evaluations=await this.db.weeklyEvaluation.findMany({where:{programId},orderBy:{weekNumber:'desc'},take:2});
    const sessions=await this.db.workoutSession.findMany({where:{programId,status:{in:['COMPLETED','MISSED']}},orderBy:{scheduledDate:'desc'},take:20,include:{logs:true}});
    let signals=0;
    if(evaluations.length>=2&&evaluations.every(e=>(e.averageRpe??0)>8.5))signals++;
    if(evaluations.length>=2&&evaluations.every(e=>e.compliancePercent<70))signals++;
    const currentWeek=Math.max(1,Math.floor((Date.now()-program.startDate.getTime())/6048e5)+1);
    if(currentWeek>=8&&!evaluations.some(e=>e.status==='CONSIDER_RECOVERY'&&e.userAction==='APPLY'))signals++;
    const recent=sessions.slice(0,3);
    if(recent.length>=3&&recent.every(s=>/nyeri|sakit/i.test(`${s.notes||''} ${s.logs.map(l=>l.notes||'').join(' ')}`)))signals++;
    if(sessions.filter(s=>/sangat lelah/i.test(`${s.notes||''} ${s.logs.map(l=>l.notes||'').join(' ')}`)).length>=3)signals++;
    if(evaluations[0]&&evaluations[1]){
      const vNow=await this.volumeForWeek(programId,evaluations[0].weekNumber);
      const vPast=await this.volumeForWeek(programId,evaluations[1].weekNumber);
      if(vPast>0&&vNow<vPast*.85)signals++;
    }
    return signals>=2;
  }
}
