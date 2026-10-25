import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function DesktopCreditsDialog({open,onOpenChange,balance,onUnlock}:{open:boolean;onOpenChange:(open:boolean)=>void;balance:number|null;onUnlock:()=>void}) {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md" dir={ar?'rtl':'ltr'}><DialogHeader><DialogTitle>MatchMe</DialogTitle><DialogDescription>{ar?'رصيد متبقٍ':'credits remaining'}</DialogDescription></DialogHeader><p className="text-4xl font-semibold tabular-nums py-6">{balance??'—'}</p><Button className="h-12" onClick={onUnlock}>{ar?'افتح المزيد الآن':'Unlock more now'}</Button></DialogContent></Dialog>;
}
