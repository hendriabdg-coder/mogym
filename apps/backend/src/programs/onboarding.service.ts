import { BadRequestException, Injectable } from '@nestjs/common';
import { WeeklyPattern } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmProgramDto, ProfileDto, ProgramPreviewDto } from './program.dto';
import { ProgramRecommendationService } from './program-recommendation.service';
import { SessionBuilderService } from './session-builder.service';

@Injectable()
export class OnboardingService {
  constructor(private db: PrismaService, private recommendation: ProgramRecommendationService, private builder: SessionBuilderService) {}
  async saveProfile(userId: string, dto: ProfileDto) {
    const profile = await this.db.userProfile.upsert({
      where:{ userId }, update:{ dateOfBirth:new Date(dto.dateOfBirth),gender:dto.gender,heightCm:dto.heightCm,onboardingWeightKg:dto.weightKg,activityLevel:dto.activityLevel,timezone:dto.timezone },
      create:{ userId,dateOfBirth:new Date(dto.dateOfBirth),gender:dto.gender,heightCm:dto.heightCm,onboardingWeightKg:dto.weightKg,activityLevel:dto.activityLevel,timezone:dto.timezone },
    });
    return { profile, weightKg:dto.weightKg };
  }
  async preview(userId: string, dto: ProgramPreviewDto) {
    const profile = await this.db.userProfile.findUnique({ where:{ userId } });
    if (!profile?.gender || !profile.dateOfBirth || !profile.heightCm || !profile.activityLevel) throw new BadRequestException('Lengkapi profil terlebih dahulu');
    const latest = await this.db.weeklyWeight.findFirst({ where:{ userId }, orderBy:{ weighDate:'desc' } });
    const active = await this.db.cuttingProgram.findFirst({ where:{ userId,status:'ACTIVE' }, orderBy:{createdAt:'desc'} });
    const weightKg = latest?.weightKg || active?.currentWeight || profile.onboardingWeightKg;
    if (!weightKg) throw new BadRequestException('Berat badan belum tersedia. Simpan profil onboarding pada sesi yang sama sebelum preview.');
    const age = Math.floor((Date.now()-profile.dateOfBirth.getTime())/31_557_600_000);
    return this.recommendation.recommend({ ...dto, targetDate:new Date(dto.targetDate), gender:profile.gender, age, heightCm:profile.heightCm, weightKg, activityLevel:profile.activityLevel });
  }
  async confirm(userId: string, dto: ConfirmProgramDto) {
    const rec = await this.preview(userId,dto);
    if (rec.warnings.some((w) => w.includes('agresif')) && !dto.confirmAggressiveTarget) throw new BadRequestException({ message:'Target agresif memerlukan konfirmasi', code:'AGGRESSIVE_TARGET_CONFIRMATION_REQUIRED' });
    const existing = await this.db.cuttingProgram.findFirst({ where:{userId,status:'ACTIVE'} });
    const latest = await this.db.weeklyWeight.findFirst({where:{userId},orderBy:{weighDate:'desc'}});
    const profile = await this.db.userProfile.findUnique({where:{userId}});
    const startWeight = latest?.weightKg || existing?.currentWeight || profile?.onboardingWeightKg;
    if (!startWeight) throw new BadRequestException('Berat awal tidak tersedia');
    const patternMap: Record<string,WeeklyPattern> = {'3_4':'P3_4','4_3':'P4_3','5_2':'P5_2','6_1':'P6_1'};
    const result = await this.db.$transaction(async (tx) => {
      await tx.cuttingProgram.updateMany({where:{userId,status:'ACTIVE'},data:{status:'PAUSED'}});
      const program = await tx.cuttingProgram.create({data:{
        userId,targetType:dto.targetType,startWeight,currentWeight:startWeight,
        targetWeight:dto.targetType==='WEIGHT'?dto.targetValue:null,targetBodyFat:dto.targetType==='BODY_FAT'?dto.targetValue:null,
        startDate:new Date(),targetDate:new Date(dto.targetDate),weeklyPattern:patternMap[rec.weeklyPattern],
        sessionDurationMinutes:dto.sessionDurationMinutes,unavailableDays:[0,1,2,3,4,5,6].filter(d=>!dto.availableDays.includes(d)),
        caloricTarget:rec.caloricTarget,proteinGrams:rec.proteinGrams,carbsGrams:rec.carbsGrams,fatGrams:rec.fatGrams,
        progressiveOverloadEnabled:dto.progressiveOverloadEnabled,weeklyWeightTargetEnabled:dto.weeklyWeightTargetEnabled,
        weeklyWeightTargetKg:Math.min(1,Math.max(.25,(startWeight-(dto.targetType==='WEIGHT'?dto.targetValue:startWeight))/Math.max(1,rec.estimatedWeeksToGoal))),
        foodChecklistEnabled:dto.foodChecklistEnabled,
      }});
      const sessions = [];
      for (const item of rec.splitPlan) {
        const plan = await this.builder.buildSession(item.splitType,dto.sessionDurationMinutes,dto.injuryNotes);
        const split = await tx.workoutSplit.create({data:{
          programId:program.id,dayOfWeek:item.weekday,weekNumber:1,splitType:item.splitType,sessionOrder:item.sessionOrder,
          estimatedDurationMinutes:item.estimatedDurationMinutes,
          exercises:{create:plan.exercises.map((x:any)=>({exerciseId:x.exercise.id,orderIndex:x.orderIndex,sets:x.sets,targetRepsMin:x.targetRepsMin,targetRepsMax:x.targetRepsMax,restSeconds:x.restSeconds,phase:x.phase}))},
        }});
        const date = this.nextWeekday(item.weekday);
        sessions.push(await tx.workoutSession.create({data:{programId:program.id,splitId:split.id,userId,scheduledDate:date}}));
      }
      return {program,sessions};
    });
    return {...result,recommendation:rec};
  }
  private nextWeekday(day:number) {
    const d=new Date(); d.setHours(12,0,0,0); let delta=(day-d.getDay()+7)%7; if(delta===0) delta=7; d.setDate(d.getDate()+delta); return d;
  }
}
