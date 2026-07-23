import type {Metadata,Viewport} from 'next';
import {Inter,Plus_Jakarta_Sans} from 'next/font/google';
import './globals.css';
import {Providers} from './providers';
const inter=Inter({subsets:['latin'],variable:'--font-inter'});
const jakarta=Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-jakarta'});
export const metadata:Metadata={title:{default:'CutTrack',template:'%s • CutTrack'},description:'Program latihan cutting terstruktur untuk pemula',manifest:'/manifest.json',icons:{apple:'/icons/icon-192.png'}};
export const viewport:Viewport={themeColor:'#22C55E',colorScheme:'dark',width:'device-width',initialScale:1,viewportFit:'cover'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body className={`${inter.variable} ${jakarta.variable}`}><Providers>{children}</Providers></body></html>}
