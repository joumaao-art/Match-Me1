import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Scroll-snap wheel with keyboard and explicit accessible option selection. */
export function Wheel({ label, options, value, onChange }: {label:string;options:{value:string;label:string}[];value:string;onChange:(value:string)=>void}) {
 const root=useRef<HTMLDivElement>(null);const settling=useRef<ReturnType<typeof setTimeout>>();const interacting=useRef(false);
 useEffect(()=>{clearTimeout(settling.current);interacting.current=false;const i=options.findIndex(o=>o.value===value);if(root.current&&i>=0&&Math.abs(root.current.scrollTop-i*44)>22)root.current.scrollTo({top:i*44,behavior:'auto'});},[value,options]);
 useEffect(()=>()=>clearTimeout(settling.current),[]);
 return <div className="min-w-0"><p className="text-xs text-muted-foreground mb-2 text-center">{label}</p><div className="relative rounded-xl border overflow-hidden bg-background">
 <div className="absolute inset-x-0 top-[44px] h-11 border-y bg-primary/5 pointer-events-none" />
 <div ref={root} role="listbox" aria-label={label} tabIndex={0} className="h-[132px] overflow-y-auto snap-y snap-mandatory overscroll-contain scrollbar-hide relative py-11"
 onKeyDown={e=>{const i=options.findIndex(o=>o.value===value);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();onChange(options[Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1)))].value);}}}
 onPointerDown={()=>{interacting.current=true;}} onWheel={()=>{interacting.current=true;}}
 onScroll={()=>{if(!interacting.current)return;clearTimeout(settling.current);settling.current=setTimeout(()=>{if(!root.current||!interacting.current)return;interacting.current=false;const i=Math.max(0,Math.min(options.length-1,Math.round(root.current.scrollTop/44)));if(options[i].value!==value)onChange(options[i].value);},120);}}>
 {options.map(o=><button key={o.value} type="button" role="option" aria-selected={value===o.value} onClick={()=>onChange(o.value)} className={cn('w-full h-11 snap-center text-sm px-1',value===o.value?'font-semibold text-primary':'text-muted-foreground')}>{o.label}</button>)}
 </div></div></div>;
}
export function DateWheels({label,value,onChange,monthOnly=false,future=false,lang='en'}:{label:string;value:string;onChange:(v:string)=>void;monthOnly?:boolean;future?:boolean;lang?:string}) {
 const now=new Date();const parts=value.split('-');const y=Number(parts[0])||now.getFullYear()-20,m=Number(parts[1])||1,d=Number(parts[2])||1;
 const maxYear=now.getFullYear()+(future?10:0);const maxMonth=!future&&y===now.getFullYear()?now.getMonth()+1:12;
 const days=Math.min(new Date(y,m,0).getDate(),!future&&y===now.getFullYear()&&m===now.getMonth()+1?now.getDate():31);
 const update=(year:number,month:number,day:number)=>{const mm=Math.min(month,!future&&year===now.getFullYear()?now.getMonth()+1:12);const dd=Math.min(day,new Date(year,mm,0).getDate(),!future&&year===now.getFullYear()&&mm===now.getMonth()+1?now.getDate():31);onChange(`${year}-${String(mm).padStart(2,'0')}${monthOnly?'':`-${String(dd).padStart(2,'0')}`}`);};
 const nums=(n:number)=>Array.from({length:n},(_,i)=>({value:String(i+1),label:String(i+1).padStart(2,'0')}));
 return <div role="group" aria-label={label} className={cn('grid gap-2',monthOnly?'grid-cols-2':'grid-cols-3')}>
 {!monthOnly&&<Wheel label={lang==='ar'?'اليوم':'Day'} options={nums(days)} value={String(Math.min(d,days))} onChange={v=>update(y,m,Number(v))}/>}
 <Wheel label={lang==='ar'?'الشهر':'Month'} options={nums(maxMonth).map(o=>({...o,label:monthOnly?o.label:new Intl.DateTimeFormat(lang,{month:'short'}).format(new Date(2000,Number(o.value)-1,1))}))} value={String(m)} onChange={v=>update(y,Number(v),d)}/>
 <Wheel label={lang==='ar'?'السنة':'Year'} options={Array.from({length:maxYear-(now.getFullYear()-100)+1},(_,i)=>({value:String(maxYear-i),label:String(maxYear-i)}))} value={String(y)} onChange={v=>update(Number(v),m,d)}/>
 </div>;
}
/** Bounded searchable selections; a typed query is never silently committed. */
export function MobileSearch({id,label,options,value,onChange,multiple=false,custom=false,lang='en'}:{id:string;label:string;options:string[];value:string[];onChange:(v:string[])=>void;multiple?:boolean;custom?:boolean;lang?:string}) {
 const [q,setQ]=useState('');const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 const matches=options.filter(o=>o.toLowerCase().includes(q.trim().toLowerCase())).slice(0,30);
 const pick=(v:string)=>{const trimmed=v.trim();if(!trimmed)return;onChange(multiple?[...new Set([...value,trimmed])]:[trimmed]);setQ('');setOpen(false);};
 useEffect(()=>{const h=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',h);return()=>document.removeEventListener('pointerdown',h);},[]);
 return <div ref={root} className="relative">
 {multiple&&value.length>0&&<div className="flex flex-wrap gap-2 mb-2">{value.map(v=><span key={v} className="inline-flex items-center text-sm bg-primary/10 text-primary rounded-lg ps-3"><span className="break-words">{v}</span><button type="button" aria-label={`${lang==='ar'?'إزالة':'Remove'} ${v}`} className="h-11 w-11 flex items-center justify-center" onClick={()=>onChange(value.filter(x=>x!==v))}><X size={16}/></button></span>)}</div>}
 <Input id={id} role="combobox" aria-label={label} aria-expanded={open} aria-controls={`${id}-options`} value={open?q:multiple?'':value[0]||''} placeholder={label} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true);}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Enter'){e.preventDefault();if(matches[0])pick(matches[0]);else if(custom)pick(q);}}}/>
 {open&&<div id={`${id}-options`} role="listbox" className="mt-2 max-h-52 overflow-y-auto border rounded-lg bg-popover" aria-multiselectable={multiple||undefined}>{matches.map(o=><button type="button" key={o} role="option" aria-selected={value.includes(o)} className="w-full min-h-11 px-3 py-2 text-start text-sm hover:bg-muted flex items-center justify-between" onClick={()=>pick(o)}>{o}{value.includes(o)&&<Check size={16}/>}</button>)}{custom&&q.trim()&&!options.includes(q.trim())&&<button type="button" className="w-full min-h-11 text-start px-3 text-primary" onClick={()=>pick(q)}>{lang==='ar'?'إضافة':'Add'} “{q.trim()}”</button>}{!matches.length&&!custom&&<p className="p-3 text-sm text-muted-foreground">{lang==='ar'?'لا توجد نتائج':'No results'}</p>}</div>}
 </div>;
}
