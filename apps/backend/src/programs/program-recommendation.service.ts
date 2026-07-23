import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityLevel, Gender, SplitType, TargetType } from '@prisma/client';

export type RecommendationInput = {
  gender: Gender; age: number; heightCm: number; weightKg: number; activityLevel: ActivityLevel;
  targetType: TargetType; targetValue: number; targetDate: Date; availableDays: number[];
  sessionDurationMinutes: number; hasInjury: boolean; injuryNotes?: string; requestedPattern?: '3_4'|'4_3'|'5_2'|'6_1';
};

const patterns: Record<string, SplitType[]> = {
  '3_4': ['FULL_BODY_A','FULL_BODY_B','FULL_BODY_C'],
  '4_3': ['UPPER_A','LOWER_A','UPPER_B','LOWER_B'],
  '5_2': ['PUSH_A','PULL_A','LEGS_A','UPPER_A','LOWER_A'],
  '6_1': ['PUSH_A','PULL_A','LEGS_A','PUSH_B','PULL_B','LEGS_B'],
};
const activity: Record<ActivityLevel, number> = { SEDENTARY:1.2, LIGHT:1.375, MODERATE:1.55, ACTIVE:1.725, VERY_ACTIVE:1.9 };

@Injectable()
export class ProgramRecommendationService {
  recommend(input: RecommendationInput) {
    const days = [...new Set(input.availableDays)].sort();
    if (days.some((d) => d < 0 || d > 6)) throw new BadRequestException('Hari tersedia harus berada pada rentang 0-6');
    const warnings: string[] = [];
    if (days.length === 2) warnings.push('Dua hari latihan belum ideal. Program tetap dibuat dengan volume yang disesuaikan.');
    let weeklyPattern: keyof typeof patterns = days.length <= 3 ? '3_4' : '4_3';
    if (input.requestedPattern && patterns[input.requestedPattern].length <= days.length) weeklyPattern = input.requestedPattern;
    if (input.activityLevel === 'VERY_ACTIVE' && input.sessionDurationMinutes <= 45) weeklyPattern = days.length >= 4 ? '4_3' : '3_4';
    if (input.hasInjury) {
      weeklyPattern = '3_4';
      warnings.push('Program memakai full body konservatif karena ada kondisi fisik. Ini bukan diagnosis medis.');
    }
    const count = Math.min(patterns[weeklyPattern].length, days.length);
    const selectedDays = this.distribute(days, count);
    const splits = patterns[weeklyPattern].slice(0, count);
    const scheduledDays = selectedDays.map((weekday, i) => ({ weekday, splitType: splits[i] }));

    const weeks = Math.max(1, (input.targetDate.getTime() - Date.now()) / 604_800_000);
    const targetWeight = input.targetType === 'WEIGHT' ? input.targetValue : input.weightKg;
    const weeklyLoss = Math.max(0, (input.weightKg - targetWeight) / weeks);
    if (weeklyLoss > 1.2) warnings.push('Target ini mungkin terlalu agresif. Konfirmasi diperlukan sebelum program disimpan.');
    const safeLoss = Math.min(weeklyLoss || 0.5, 1);
    const bmr = 10*input.weightKg + 6.25*input.heightCm - 5*input.age + (input.gender === 'MALE' ? 5 : -161);
    const rawCalories = Math.round(bmr*activity[input.activityLevel] - safeLoss*1100);
    const minimum = input.gender === 'MALE' ? 1500 : 1200;
    const caloricTarget = Math.max(minimum, rawCalories);
    if (rawCalories < minimum) warnings.push(`Target kalori dikoreksi ke batas aman minimum ${minimum} kkal.`);
    const proteinGrams = Math.round(input.weightKg*2.1);
    const fatGrams = Math.round(input.weightKg*0.8);
    const carbsGrams = Math.max(0, Math.round((caloricTarget - proteinGrams*4 - fatGrams*9)/4));
    return {
      weeklyPattern, scheduledDays, caloricTarget, proteinGrams, carbsGrams, fatGrams,
      estimatedWeeksToGoal: input.targetType === 'WEIGHT' ? Math.ceil(Math.max(0,input.weightKg-targetWeight)/(safeLoss || .5)) : Math.ceil(weeks),
      warnings,
      splitPlan: scheduledDays.map((x,i) => ({ ...x, sessionOrder:i+1, estimatedDurationMinutes:input.sessionDurationMinutes })),
    };
  }

  private distribute(days: number[], count: number) {
    if (count >= days.length) return days.slice(0,count);
    const chosen = [days[0]];
    while (chosen.length < count) {
      const candidate = days.filter((d) => !chosen.includes(d)).sort((a,b) => {
        const da = Math.min(...chosen.map(c => Math.min(Math.abs(c-a),7-Math.abs(c-a))));
        const db = Math.min(...chosen.map(c => Math.min(Math.abs(c-b),7-Math.abs(c-b))));
        return db-da;
      })[0];
      chosen.push(candidate);
    }
    return chosen.sort();
  }
}
