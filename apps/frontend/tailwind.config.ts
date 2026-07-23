import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],theme:{extend:{colors:{surface:'#0F1117',card:'#1A1D27',elevated:'#232736',green:'#22C55E',amber:'#F59E0B',danger:'#EF4444',info:'#3B82F6',line:'#2D3748'},fontFamily:{sans:['Inter','sans-serif'],heading:['var(--font-jakarta)','sans-serif']}}},plugins:[]} satisfies Config;
