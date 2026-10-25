import { Input } from '@/components/ui/input';

export function DesktopDateControl({label,value,onChange,monthOnly=false,future=false}:{label:string;value:string;onChange:(value:string)=>void;monthOnly?:boolean;future?:boolean;lang?:string}) {
 const now=new Date();const max=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}${monthOnly?'':`-${String(now.getDate()).padStart(2,'0')}`}`;
 return <Input aria-label={label} type={monthOnly?'month':'date'} value={value} max={future?undefined:max} onChange={event=>onChange(event.target.value)} className="h-11"/>;
}
