import { ProgramRecommendationService } from './program-recommendation.service';
describe('ProgramRecommendationService',()=>{
  const service=new ProgramRecommendationService();
  const base:any={gender:'MALE',age:30,heightCm:175,weightKg:90,activityLevel:'MODERATE',targetType:'WEIGHT',targetValue:80,targetDate:new Date(Date.now()+20*6048e5),availableDays:[1,2,3,4],sessionDurationMinutes:60,hasInjury:false};
  it('memilih pola 4-3 untuk empat hari',()=>expect(service.recommend(base).weeklyPattern).toBe('4_3'));
  it('mengoreksi kalori minimum',()=>{
    const result=service.recommend({...base,targetValue:50,targetDate:new Date(Date.now()+2*6048e5)});
    expect(result.caloricTarget).toBeGreaterThanOrEqual(1500);expect(result.warnings.join(' ')).toMatch(/agresif/);
  });
  it('memilih full body saat cedera',()=>expect(service.recommend({...base,hasInjury:true}).weeklyPattern).toBe('3_4'));
});
