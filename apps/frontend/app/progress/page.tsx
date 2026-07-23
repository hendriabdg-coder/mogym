'use client';
import dynamic from'next/dynamic';
import{useMutation,useQuery,useQueryClient}from'@tanstack/react-query';
import{useState}from'react';
import{AppShell}from'@/components/navigation';
import{ProgressPhotos}from'@/components/progress-photos';
import{Button,Card,EmptyState,Modal,WeightInput}from'@/components/ui';
import{api}from'@/lib/api';
import{useDashboard,useProgramId}from'@/lib/hooks';
const Chart=dynamic(()=>import('@/components/weight-chart'),{ssr:false});

export default function Progress(){
  const id=useProgramId(),qc=useQueryClient(),[open,setOpen]=useState(false),[weight,setWeight]=useState(0),[tab,setTab]=useState('Berat Badan');
  const{data:d}=useDashboard();
  const{data:h}=useQuery({queryKey:['weights',id],queryFn:()=>api<any>(`/weight/history?programId=${id}`),enabled:!!id});
  const log=useMutation({mutationFn:()=>api(`/weight/log?programId=${id}`,{method:'POST',body:JSON.stringify({weightKg:weight,date:new Date().toISOString()})}),onSuccess:()=>{setOpen(false);qc.invalidateQueries({queryKey:['weights',id]});qc.invalidateQueries({queryKey:['dashboard',id]})}});
  return <AppShell title="Progres" action={tab==='Berat Badan'?<Button onClick={()=>setOpen(true)}>+ Catat</Button>:undefined}>
    <div className="mb-5 flex gap-2">{['Berat Badan','Latihan','Foto'].map(x=><button key={x} onClick={()=>setTab(x)} className={`rounded-full px-4 py-2 text-sm ${tab===x?'bg-green text-black':'bg-elevated'}`}>{x}</button>)}</div>
    {tab==='Berat Badan'&&<><div className="grid grid-cols-4 gap-2">{[['Awal',d?.weight.initial],['Sekarang',d?.weight.current],['Target',d?.weight.target],['Perubahan',d?.weight.change]].map(([l,v])=><Card className="p-3" key={l}><p className="text-[11px] text-slate-400">{l}</p><b>{v??'—'} kg</b></Card>)}</div><Card className="mt-4"><h2 className="mb-4 font-bold">Tren mingguan</h2>{h?.trend?.length?<Chart data={h.trend.map((x:any)=>({week:`M${x.weekNumber}`,weight:x.weightKg}))}/>:<EmptyState title="Belum ada data" description="Catat berat pertama untuk melihat tren."/>}</Card><div className="mt-4 grid gap-2">{h?.entries?.slice().reverse().map((x:any)=><Card className="flex justify-between p-4" key={x.id}><span>{new Date(x.weighDate).toLocaleDateString('id-ID',{dateStyle:'medium'})}</span><b>{x.weightKg} kg</b></Card>)}</div></>}
    {tab==='Latihan'&&<div className="grid gap-4"><Card><h2 className="font-bold">Volume latihan</h2><p className="mt-2 text-3xl font-bold text-green">{d?.charts.volumeHistory.at(-1)?.totalVolume??0} kg</p><p className="text-sm text-slate-400">Volume minggu terakhir</p></Card><Card><h2 className="font-bold">Kepatuhan</h2><p className="mt-2 text-3xl font-bold">{d?.thisWeek.compliancePercent??0}%</p></Card></div>}
    {tab==='Foto'&&<ProgressPhotos currentWeek={d?.program.currentWeek||1}/>}
    <Modal open={open} onClose={()=>setOpen(false)}><h2 className="mb-5 font-heading text-xl font-bold">Catat berat</h2><WeightInput value={weight} onChange={setWeight}/><Button className="mt-5 w-full" onClick={()=>log.mutate()} disabled={!weight||log.isPending}>Simpan</Button></Modal>
  </AppShell>
}
