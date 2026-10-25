import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { logoutMobileSeeker } from '@/services/mobile-logout';

export function DesktopProfileLogout({ uid }: { uid: string }) {
 const {i18n}=useTranslation(); const ar=i18n.language.startsWith('ar');
 const copy=(en:string,arabic:string)=>ar?arabic:en;
 const queryClient=useQueryClient();
 const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 const lock=useRef(false); const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const confirm=async()=>{
  if(lock.current)return; lock.current=true;setBusy(true);setError('');
  try {
   await logoutMobileSeeker(uid,()=>queryClient.clear());
   // A fresh guest document drops in-memory profile/message/credit engines and PDF URLs.
   window.location.replace('/');
  } catch {
   if(mounted.current)setError(copy('Logout could not be completed. Please retry.','تعذر إكمال تسجيل الخروج. أعد المحاولة.'));
  } finally {lock.current=false;if(mounted.current)setBusy(false);}
 };
 return <>
  <button type="button" data-testid="desktop-profile-logout" onClick={()=>{setError('');setOpen(true);}} className="mt-3 w-full min-h-14 flex items-center gap-3 px-4 py-3 border rounded-xl bg-background text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-start font-medium text-sm" dir="ltr">
   <LogOut size={20} className="shrink-0" aria-hidden="true"/><span dir={ar?'rtl':'ltr'}>{copy('Logout','تسجيل الخروج')}</span>
  </button>
  <AlertDialog open={open} onOpenChange={value=>{if(!lock.current)setOpen(value);}}>
   <AlertDialogContent dir={ar?'rtl':'ltr'} className="w-[calc(100%_-_2rem)] max-w-sm rounded-xl">
    <AlertDialogTitle>{copy('Log out?','تسجيل الخروج؟')}</AlertDialogTitle>
    <AlertDialogDescription>{copy('Are you sure you want to log out of your MatchMe account?','هل أنت متأكد أنك تريد تسجيل الخروج من حسابك في MatchMe؟')}</AlertDialogDescription>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end gap-3">
     <AlertDialogCancel disabled={busy} className="mt-0 min-h-11 !bg-transparent !hover:bg-transparent">{copy('Cancel','إلغاء')}</AlertDialogCancel>
     <Button type="button" variant="destructive" disabled={busy} className="min-h-11" onClick={()=>void confirm()}>{busy?copy('Logging out…','جارٍ تسجيل الخروج…'):copy('Logout','تسجيل الخروج')}</Button>
    </div>
   </AlertDialogContent>
  </AlertDialog>
 </>;
}
