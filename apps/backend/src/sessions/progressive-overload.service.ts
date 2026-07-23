import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ProgressiveOverloadService {
  constructor(private db:PrismaService){}
  async getRecommendation(exerciseId:string,userId:string,programId:string){
    const program=await this.db.cuttingProgram.findFirst({where:{id:programId,userId}});
    if(!program) throw new NotFoundException('Program tidak ditemukan');
    const logs=await this.db.sessionExerciseLog.findMany({
      where:{exerciseId,session:{userId,programId,status:'COMPLETED'}},include:{session:true},
      orderBy:{session:{actualDate:'desc'}},take:3,
    });
    if(logs.length<2)return{action:'MAINTAIN',reason:'Butuh minimal 2 sesi sebelum memberi rekomendasi.'};
    const complete=(log:any)=>(log.sets as any[]).every(s=>s.completed);
    const pain=logs.some(l=>/nyeri|sakit|pusing|sesak/i.test(`${l.notes||''} ${l.session.notes||''}`));
    const lastRpe=logs[0].rpe??logs[0].session.averageRpe??0;
    if(pain||lastRpe>=10)return{action:'DECREASE',value:10,reason:'RPE sangat tinggi atau keluhan terdeteksi. Turunkan beban 5–10% dan konfirmasi sebelum menerapkan.'};
    if(complete(logs[0])&&complete(logs[1])&&lastRpe<=7)return{action:'INCREASE_WEIGHT',value:2.5,reason:'Semua set selesai pada 2 sesi dan RPE terakhir ≤ 7. Konfirmasi kenaikan beban.'};
    if(complete(logs[0])&&lastRpe<=9)return{action:'INCREASE_REPS',value:1,reason:'Set selesai dengan RPE 8–9. Tambah 1 repetisi setelah dikonfirmasi.'};
    return{action:'MAINTAIN',reason:'Pertahankan beban sampai seluruh target set selesai.'};
  }
}
