'use client';
import {create} from 'zustand';
type AuthState={user:any|null,setSession:(access:string,refresh:string,user:any)=>void,logout:()=>void};
export const useAuth=create<AuthState>(set=>({user:null,setSession:(access,refresh,user)=>{localStorage.setItem('cuttrack-access',access);localStorage.setItem('cuttrack-refresh',refresh);set({user});},logout:()=>{localStorage.removeItem('cuttrack-access');localStorage.removeItem('cuttrack-refresh');set({user:null});}}));
