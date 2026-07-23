'use client';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {Camera,Trash2} from 'lucide-react';
import {api} from '@/lib/api';
import {useProgramId} from '@/lib/hooks';
import {Button,Card,EmptyState,Modal,Select} from './ui';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:3030';
export function ProgressPhotos({currentWeek=1}:{currentWeek?:number}){
  const id=useProgramId(),qc=useQueryClient(),[open,setOpen]=useState(false),[file,setFile]=useState<File>(),[angle,setAngle]=useState('FRONT'),[week,setWeek]=useState(currentWeek),[compare,setCompare]=useState<[number,number]>([Math.max(1,currentWeek-4),currentWeek]);
  const{data=[]}=useQuery({queryKey:['photos',id],queryFn:()=>api<any[]>(`/progress-photos?programId=${id}`),enabled:!!id});
  const upload=useMutation({mutationFn:()=>{const form=new FormData();form.append('photo',file!);form.append('angle',angle);form.append('weekNumber',String(week));return api('/progress-photos',{method:'POST',body:form})},onSuccess:()=>{setOpen(false);setFile(undefined);qc.invalidateQueries({queryKey:['photos',id]})}});
  const remove=useMutation({mutationFn:(photoId:string)=>api(`/progress-photos/${photoId}`,{method:'DELETE'}),onSuccess:()=>qc.invalidateQueries({queryKey:['photos',id]})});
  const byWeek=(n:number)=>data.filter((x:any)=>x.weekNumber===n);
  return <div className="grid gap-4">
    <div className="flex justify-end"><Button onClick={()=>setOpen(true)}><Camera className="mr-2 inline" size={18}/>Upload foto</Button></div>
    {!data.length?<EmptyState title="Belum ada foto progres" description="Ambil foto depan, samping, dan belakang dengan pencahayaan konsisten."/>:<>
      <Card><h2 className="font-bold">Bandingkan periode</h2><div className="mt-3 grid grid-cols-2 gap-3"><Select label="Minggu awal" value={compare[0]} onChange={e=>setCompare([Number(e.target.value),compare[1]])}>{[...new Set(data.map((x:any)=>x.weekNumber))].map((x:any)=><option key={x}>{x}</option>)}</Select><Select label="Minggu akhir" value={compare[1]} onChange={e=>setCompare([compare[0],Number(e.target.value)])}>{[...new Set(data.map((x:any)=>x.weekNumber))].map((x:any)=><option key={x}>{x}</option>)}</Select></div><div className="mt-4 grid grid-cols-2 gap-2">{compare.map(n=><div key={n}><p className="mb-2 text-center text-xs text-slate-400">Minggu {n}</p>{byWeek(n)[0]?<img className="aspect-[3/4] w-full rounded-xl object-cover" src={`${API}${byWeek(n)[0].photoUrl}`} alt={`Progres minggu ${n}`}/>:<div className="grid aspect-[3/4] place-items-center rounded-xl bg-surface text-xs text-slate-500">Belum ada foto</div>}</div>)}</div></Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{data.map((x:any)=><figure key={x.id} className="relative overflow-hidden rounded-2xl border border-line bg-card"><img className="aspect-[3/4] w-full object-cover" src={`${API}${x.photoUrl}`} alt={`${x.angle} minggu ${x.weekNumber}`}/><figcaption className="flex items-center justify-between p-3 text-xs"><span>M{x.weekNumber} · {x.angle}</span><button aria-label="Hapus foto" onClick={()=>remove.mutate(x.id)}><Trash2 size={16}/></button></figcaption></figure>)}</div>
    </>}
    <Modal open={open} onClose={()=>setOpen(false)}><h2 className="mb-5 font-heading text-xl font-bold">Upload foto progres</h2><div className="grid gap-4"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0])}/><Select label="Sudut foto" value={angle} onChange={e=>setAngle(e.target.value)}><option value="FRONT">Depan</option><option value="SIDE">Samping</option><option value="BACK">Belakang</option></Select><label className="grid gap-2 text-sm font-semibold">Minggu<input className="min-h-12 rounded-xl border border-line bg-surface px-4" type="number" min="1" value={week} onChange={e=>setWeek(Number(e.target.value))}/></label><Button disabled={!file||upload.isPending} onClick={()=>upload.mutate()}>Upload</Button><p className="text-xs text-slate-400">JPEG, PNG, atau WebP. Maksimal 5 MB.</p></div></Modal>
  </div>
}
