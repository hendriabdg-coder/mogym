import { WeeklyEvaluationService } from './evaluation.service';

describe('WeeklyEvaluationService',()=>{
  const service=new WeeklyEvaluationService(undefined as any);
  const base:any={plannedSessions:4,completedSessions:4,missedSessions:0,compliancePercent:100,averageRpe:7,weightChange:-.5,previousWeightChanges:[-.4],previousAverageRpe:[7],volumeChangePercent:2,hasComplaintsOfPain:false};
  it('menolak evaluasi saat data tidak cukup',()=>expect(service.determineStatus({...base,completedSessions:1})).toBe('INSUFFICIENT_DATA'));
  it('mendeteksi kepatuhan rendah',()=>expect(service.determineStatus({...base,completedSessions:2,compliancePercent:50})).toBe('LOW_COMPLIANCE'));
  it('mendeteksi fatigue sebelum perubahan kalori',()=>expect(service.determineStatus({...base,averageRpe:9,previousAverageRpe:[9],missedSessions:1})).toBe('FATIGUE'));
  it('menandai progres sesuai target',()=>expect(service.determineStatus(base)).toBe('ON_TRACK'));
  it('tidak menerapkan rekomendasi otomatis',()=>expect(service.recommendations('BEHIND').join(' ')).toMatch(/dikonfirmasi/));
});
