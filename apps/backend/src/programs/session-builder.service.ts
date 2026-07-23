import { Injectable } from '@nestjs/common';
import { Exercise, SplitType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const groups: Record<SplitType, string[]> = {
  FULL_BODY_A:['LEGS','CHEST','BACK','CORE'], FULL_BODY_B:['GLUTES','SHOULDERS','BACK','CORE'], FULL_BODY_C:['LEGS','CHEST','BACK','CORE'],
  UPPER_A:['CHEST','BACK','SHOULDERS','BICEPS','TRICEPS'], UPPER_B:['BACK','CHEST','SHOULDERS','TRICEPS','BICEPS'],
  LOWER_A:['LEGS','GLUTES','CORE'], LOWER_B:['GLUTES','LEGS','CORE'],
  PUSH_A:['CHEST','SHOULDERS','TRICEPS'], PUSH_B:['SHOULDERS','CHEST','TRICEPS'],
  PULL_A:['BACK','BICEPS'], PULL_B:['BACK','BICEPS'],
  LEGS_A:['LEGS','GLUTES','CORE'], LEGS_B:['GLUTES','LEGS','CORE'],
};
@Injectable()
export class SessionBuilderService {
  constructor(private db: PrismaService) {}
  async buildSession(splitType: SplitType, durationMinutes: number, injuryNotes?: string) {
    const count = durationMinutes <= 30 ? 4 : durationMinutes <= 45 ? 5 : durationMinutes <= 60 ? 6 : durationMinutes <= 75 ? 7 : 8;
    const candidates = await this.db.exercise.findMany({ where: { muscleGroup: { in: groups[splitType] as any } }, orderBy: [{ isCompound:'desc' },{ name:'asc' }] });
    const blocked = (injuryNotes || '').toLowerCase();
    const safe = candidates.filter((e) => !e.contraindications.some((c) => blocked.includes(c)));
    const selected: Exercise[] = [];
    for (const group of groups[splitType]) {
      const found = safe.find((e) => e.muscleGroup === group && !selected.includes(e));
      if (found) selected.push(found);
    }
    for (const e of safe) if (selected.length < count && !selected.includes(e)) selected.push(e);
    return {
      warmupMinutes: durationMinutes <= 45 ? 5 : 10, cooldownMinutes:5,
      estimatedTotalMinutes: Math.min(durationMinutes+15, durationMinutes+10),
      exercises: selected.slice(0,count).map((e,i) => ({
        exercise:e, orderIndex:i, sets:durationMinutes <= 30 ? (e.isCompound ? 3:2) : durationMinutes >= 75 ? 4:3,
        targetRepsMin:e.isCompound ? 6:10, targetRepsMax:e.isCompound ? 10:15,
        restSeconds:e.isCompound ? 120:60, phase:i < 3 ? 'MAIN':'ACCESSORY',
      })),
    };
  }
}
