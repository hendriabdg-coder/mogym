'use client';
import{AppShell}from'@/components/navigation';
import{FoodChecklist}from'@/components/food-checklist';
import{Card,ProgressBar}from'@/components/ui';
import{useDashboard}from'@/lib/hooks';
export default function Nutrition(){const{data:d}=useDashboard();return <AppShell title="Target Nutrisi"><div className="grid gap-4"><Card className="text-center"><p className="text-sm text-slate-400">Kalori harian</p><p className="my-3 font-heading text-5xl font-bold text-green">{d?.nutrition.calories??'—'}</p><p className="text-sm text-slate-400">kkal / hari</p></Card><div className="grid gap-3">{[['Protein',d?.nutrition.protein,'text-green'],['Karbohidrat',d?.nutrition.carbs,'text-info'],['Lemak',d?.nutrition.fat,'text-amber']].map(([l,v,c]:any)=><Card key={l}><div className="mb-3 flex justify-between"><span>{l}</span><b className={c}>{v??'—'} g</b></div><ProgressBar value={Math.min(100,(v||0)/2.5)}/></Card>)}</div><FoodChecklist/></div></AppShell>}
