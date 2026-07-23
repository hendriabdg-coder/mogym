'use client';import{useQuery}from'@tanstack/react-query';import{api}from'./api';
export function useProgramId(){return typeof window!=='undefined'?localStorage.getItem('cuttrack-program')||'':''}
export function useDashboard(){const id=useProgramId();return useQuery({queryKey:['dashboard',id],queryFn:()=>api<any>(`/dashboard/summary?programId=${id}`),enabled:!!id})}
