import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { calendarDays, chronologicalYears, dateWheelParts, dateWheelValue, wheelIndex, WHEEL_ROW_HEIGHT } from '@/lib/mobile-date-wheel';

/** Fixed-height block rows keep the highlighted option, scroll index and stored value identical. */
export function Wheel({ label, options, value, onChange }: {label:string;options:{value:string;label:string}[];value:string;onChange:(value:string)=>void}) {
 const root=useRef<HTMLDivElement>(null);
 const settling=useRef<ReturnType<typeof setTimeout>>();
 const interacting=useRef(false);
 const pointerStart=useRef<number|null>(null);
 const dragged=useRef(false);
 const latest=useRef({options,value,onChange});latest.current={options,value,onChange};
 const optionValues=options.map(o=>o.value).join('|');
 useEffect(()=>{
  clearTimeout(settling.current);interacting.current=false;
  const i=latest.current.options.findIndex(o=>o.value===value);
  if(root.current&&i>=0)root.current.scrollTo({top:i*WHEEL_ROW_HEIGHT,behavior:'instant' as ScrollBehavior});
 },[value,optionValues]);
 useEffect(()=>()=>clearTimeout(settling.current),[]);
 const select=(next:string)=>{clearTimeout(settling.current);interacting.current=false;latest.current.onChange(next);};
 return <div className="min-w-0"><p className="text-xs text-muted-foreground mb-2 text-center">{label}</p><div className="relative rounded-xl border overflow-hidden bg-background">
 <div className="absolute inset-x-0 top-[44px] h-11 border-y border-primary/30 bg-primary/5 pointer-events-none" />
 <div ref={root} role="listbox" aria-label={label} tabIndex={0} className="h-[132px] overflow-y-auto snap-y snap-mandatory overscroll-contain scrollbar-hide relative"
 onKeyDown={e=>{const i=options.findIndex(o=>o.value===value);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const option=options[Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1)))];if(option)select(option.value);}}}
 onPointerDown={e=>{pointerStart.current=e.clientY;dragged.current=false;interacting.current=true;}}
 onPointerMove={e=>{if(pointerStart.current!==null&&Math.abs(e.clientY-pointerStart.current)>5)dragged.current=true;}}
 onPointerUp={()=>{pointerStart.current=null;}} onPointerCancel={()=>{pointerStart.current=null;dragged.current=true;}}
 onWheel={()=>{dragged.current=true;interacting.current=true;}}
 onScroll={()=>{if(!interacting.current)return;clearTimeout(settling.current);settling.current=setTimeout(()=>{
  if(!root.current||!interacting.current)return;
  interacting.current=false;
  const {options:items,value:selected,onChange:commit}=latest.current;
  const index=wheelIndex(root.current.scrollTop,items.length);
  const option=items[index];if(!option)return;
  root.current.scrollTo({top:index*WHEEL_ROW_HEIGHT,behavior:'instant' as ScrollBehavior});
  if(option.value!==selected)commit(option.value);
 },180);}}>
 <div aria-hidden="true" className="h-11 shrink-0" />
 {options.map(o=><button key={o.value} type="button" role="option" aria-selected={value===o.value} tabIndex={-1} onClick={()=>{if(!dragged.current)select(o.value);}} className={cn('block w-full h-11 snap-center text-sm px-1 leading-[44px] tabular-nums',value===o.value?'font-semibold text-primary':'text-muted-foreground')}>{o.label}</button>)}
 <div aria-hidden="true" className="h-11 shrink-0" />
 </div></div></div>;
}
export function DateWheels({label,value,onChange,monthOnly=false,future=false,lang='en'}:{label:string;value:string;onChange:(v:string)=>void;monthOnly?:boolean;future?:boolean;lang?:string}) {
 const now=new Date();const {year:y,month:m,day:d}=dateWheelParts(value,now);
 const minYear=Math.min(now.getFullYear()-100,y),maxYear=Math.max(now.getFullYear()+(future?10:0),y);
 const maxMonth=!future&&y===now.getFullYear()?now.getMonth()+1:12;
 const days=Math.min(calendarDays(y,m),!future&&y===now.getFullYear()&&m===now.getMonth()+1?now.getDate():31);
 const yearOptions=useMemo(()=>chronologicalYears(minYear,maxYear).map(year=>({value:year,label:year})),[minYear,maxYear]);
 const update=(year:number,month:number,day:number)=>onChange(dateWheelValue(year,month,day,monthOnly,future,now));
 const nums=(n:number)=>Array.from({length:n},(_,i)=>({value:String(i+1),label:String(i+1).padStart(2,'0')}));
 return <div role="group" aria-label={label} className={cn('grid gap-2 w-full mx-auto',monthOnly?'grid-cols-2':'grid-cols-3')}>
 {!monthOnly&&<Wheel label={lang==='ar'?'اليوم':'Day'} options={nums(days)} value={String(Math.min(d,days))} onChange={v=>update(y,m,Number(v))}/>}
 <Wheel label={lang==='ar'?'الشهر':'Month'} options={nums(maxMonth).map(o=>({...o,label:monthOnly?o.label:new Intl.DateTimeFormat(lang,{month:'short'}).format(new Date(2000,Number(o.value)-1,1))}))} value={String(m)} onChange={v=>update(y,Number(v),d)}/>
 <Wheel label={lang==='ar'?'السنة':'Year'} options={yearOptions} value={String(y)} onChange={v=>update(Number(v),m,d)}/>
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
