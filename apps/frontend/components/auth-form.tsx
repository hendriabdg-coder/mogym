'use client';
import {zodResolver} from '@hookform/resolvers/zod';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {api} from '@/lib/api';
import {useAuth} from '@/lib/store';
import {Button,Input} from './ui';

const schemas={
  login:z.object({email:z.string().email('Email tidak valid'),password:z.string().min(1,'Wajib diisi')}),
  register:z.object({name:z.string().min(2),email:z.string().email(),password:z.string().min(8,'Minimal 8 karakter')}),
  forgot:z.object({email:z.string().email()}),
  reset:z.object({newPassword:z.string().min(8)}),
};
export function AuthForm({mode}:{mode:keyof typeof schemas}){
  const schema=schemas[mode];
  const{register,handleSubmit,formState:{errors,isSubmitting}}=useForm<any>({resolver:zodResolver(schema as any)});
  const[message,setMessage]=useState('');const auth=useAuth();const router=useRouter();
  async function submit(values:any){try{
    if(mode==='login'){const r:any=await api('/auth/login',{method:'POST',body:JSON.stringify(values)});auth.setSession(r.accessToken,r.refreshToken,r.user);router.push('/dashboard')}
    else if(mode==='register'){await api('/auth/register',{method:'POST',body:JSON.stringify(values)});router.push('/verify-email')}
    else if(mode==='forgot'){await api('/auth/forgot-password',{method:'POST',body:JSON.stringify(values)});setMessage('Jika email terdaftar, instruksi reset sudah dikirim.')}
    else{const token=new URLSearchParams(window.location.search).get('token');await api('/auth/reset-password',{method:'POST',body:JSON.stringify({...values,token})});router.push('/login')}
  }catch(e:any){setMessage(e.message)}}
  return <form onSubmit={handleSubmit(submit)} className="grid gap-4">
    {mode==='register'&&<Input label="Nama" {...register('name')} error={errors.name?.message as string}/>}
    {mode!=='reset'&&<Input label="Email" type="email" {...register('email')} error={errors.email?.message as string}/>}
    {mode!=='forgot'&&<Input label={mode==='reset'?'Kata sandi baru':'Kata sandi'} type="password" {...register(mode==='reset'?'newPassword':'password')} error={(errors as any)[mode==='reset'?'newPassword':'password']?.message}/>}
    {message&&<p role="alert" className="rounded-xl bg-amber/10 p-3 text-sm text-amber">{message}</p>}
    <Button disabled={isSubmitting}>{isSubmitting?'Memproses…':{login:'Masuk',register:'Daftar gratis',forgot:'Kirim instruksi',reset:'Ubah kata sandi'}[mode]}</Button>
    {mode==='login'&&<div className="flex justify-between text-sm text-slate-400"><Link href="/register">Belum punya akun?</Link><Link href="/forgot-password">Lupa kata sandi?</Link></div>}
  </form>
}
