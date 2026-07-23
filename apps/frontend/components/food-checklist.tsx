'use client';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {Copy,Plus,Trash2} from 'lucide-react';
import {api} from '@/lib/api';
import {Button,Card} from './ui';

export function FoodChecklist(){
  const qc=useQueryClient(),[name,setName]=useState('');
  const{data}=useQuery({queryKey:['food-today'],queryFn:()=>api<any>('/food-checklist/today')});
  const items:any[]=data?.items||[];
  const save=useMutation({mutationFn:(next:any[])=>api('/food-checklist/today',{method:'POST',body:JSON.stringify({items:next})}),onSuccess:()=>qc.invalidateQueries({queryKey:['food-today']})});
  const copy=useMutation({mutationFn:()=>api('/food-checklist/copy-yesterday',{method:'POST'}),onSuccess:()=>qc.invalidateQueries({queryKey:['food-today']})});
  return <Card>
    <div className="flex items-center justify-between"><div><h2 className="font-bold">Checklist makanan</h2><p className="text-sm text-slate-400">{items.filter(x=>x.consumed).length}/{items.length} selesai</p></div><button onClick={()=>copy.mutate()} className="rounded-lg p-2 text-slate-400" aria-label="Salin kemarin"><Copy size={19}/></button></div>
    <div className="mt-4 grid gap-2">{items.map((x,i)=><div key={x.id||i} className="flex items-center gap-3 rounded-xl bg-surface p-3"><input type="checkbox" className="size-5 accent-green" checked={x.consumed} onChange={()=>save.mutate(items.map((v,j)=>j===i?{...v,consumed:!v.consumed}:v))}/><span className={`flex-1 ${x.consumed?'text-slate-500 line-through':''}`}>{x.name}</span><button aria-label="Hapus" onClick={()=>save.mutate(items.filter((_,j)=>j!==i))}><Trash2 size={17}/></button></div>)}</div>
    <form className="mt-3 flex gap-2" onSubmit={e=>{e.preventDefault();if(name.trim()){save.mutate([...items,{name:name.trim(),consumed:false}]);setName('')}}}><input className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-3" placeholder="Tambah item…" value={name} onChange={e=>setName(e.target.value)}/><Button className="min-h-11 px-3"><Plus/></Button></form>
  </Card>
}
