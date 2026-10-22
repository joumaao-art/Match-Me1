import { Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';

export function CreditsPopup({ open, onOpenChange, balance, onUnlock }: { open: boolean; onOpenChange: (open: boolean) => void; balance: number | null; onUnlock: () => void }) {
 const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
 return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
  <DrawerContent className="rounded-t-3xl max-h-[85dvh]" dir={ar ? 'rtl' : 'ltr'}>
   <div className="p-6 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
    <div className="flex items-center justify-between mb-8" dir="ltr">
     <div className="flex items-center gap-2" aria-label="MatchMe"><span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Sparkles size={20}/></span><span className="font-semibold">MatchMe</span></div>
     <DrawerClose asChild><Button variant="ghost" size="icon" className="h-11 w-11" aria-label={ar ? 'إغلاق' : 'Close'}><X size={20}/></Button></DrawerClose>
    </div>
    <DrawerTitle className="text-4xl font-semibold text-start tabular-nums">{balance ?? '—'}</DrawerTitle>
    <DrawerDescription className="text-base mt-2 mb-8 text-start">{ar ? 'رصيد متبقٍ' : 'credits remaining'}</DrawerDescription>
    <Button className="w-full h-12 text-base" onClick={onUnlock}>{ar ? 'افتح المزيد الآن' : 'Unlock more now'}</Button>
   </div>
  </DrawerContent>
 </Drawer>;
}
