'use client';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:3030';
export async function api<T>(path:string,init:RequestInit={}):Promise<T>{
  const token=typeof window!=='undefined'?localStorage.getItem('cuttrack-access'):null;
  const multipart=init.body instanceof FormData;
  const res=await fetch(`${API}${path}`,{...init,headers:{...(multipart?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{ }),...init.headers}});
  const body=await res.json().catch(()=>({success:false,error:'Respons server tidak valid'}));
  if(!res.ok||body.success===false)throw new Error(body.error||body.message||'Permintaan gagal');
  return body.data??body;
}
