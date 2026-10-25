import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores';
import { apiClient } from '@/services/api-client';
import { requireAccount, saveProfileSkills } from '@/services/mobile-account';
import { toast } from 'sonner';

export function DesktopSkills() {
 const uid=useAuthStore(s=>s.userId);const {t}=useTranslation();
 const [skills,setSkills]=useState<string[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 const [open,setOpen]=useState(false);const [editing,setEditing]=useState<string|null>(null);const [name,setName]=useState('');const [busy,setBusy]=useState(false);
 const alive=useRef(false);const lock=useRef(false);const openRef=useRef(open);openRef.current=open;
 const load=useCallback(async()=>{setLoading(true);try{if(!uid)throw new Error('Authentication required');await requireAccount(uid);const r=await apiClient.supabase.from('job_seeker_profiles').select('skills').eq('user_id',uid).single();if(r.error)throw r.error;if(alive.current&&useAuthStore.getState().userId===uid){setSkills(r.data.skills||[]);setError(false);}}catch{if(alive.current)setError(true);}finally{if(alive.current)setLoading(false);}},[uid]);
 useEffect(()=>{alive.current=true;setSkills([]);void load();const focus=()=>{if(!openRef.current&&!lock.current)void load();};window.addEventListener('focus',focus);return()=>{alive.current=false;window.removeEventListener('focus',focus);};},[load]);
 const write=async(next:string[])=>{
  if(!uid||lock.current)return;lock.current=true;setBusy(true);
  try{const result=await saveProfileSkills(uid,skills,next);if(alive.current&&useAuthStore.getState().userId===uid){setSkills(result);setOpen(false);toast.success(t('skills_saved',{defaultValue:'Skills saved'}));window.dispatchEvent(new Event('matchme:profile-changed'));}}
  catch{if(alive.current)toast.error(t('pp_save_error'));}finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 const save=()=>{const value=name.trim();if(!value||skills.some(s=>s!==editing&&s.toLocaleLowerCase()===value.toLocaleLowerCase())){toast.error(t('fill_all_fields'));return;}void write(editing?skills.map(s=>s===editing?value:s):[...skills,value]);};
 return <div className="flex-1 p-4 sm:p-6 overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('skills')}</h2><Button disabled={loading||busy||error} className="gap-2" onClick={()=>{setEditing(null);setName('');setOpen(true);}}><Plus size={16}/>{t('add_skill')}</Button></div><div className="max-w-2xl space-y-3">{loading?<p role="status">{t('loading')}</p>:error?<Button onClick={()=>void load()}>{t('try_again')}</Button>:skills.map(skill=><Card key={skill}><CardContent className="p-4 flex items-center justify-between gap-3"><p className="font-medium break-words min-w-0">{skill}</p><div className="flex items-center gap-2 shrink-0"><Button size="sm" variant="ghost" disabled={busy} aria-label={`${t('edit')} ${skill}`} onClick={()=>{setEditing(skill);setName(skill);setOpen(true);}}><Edit size={14}/></Button><Button size="sm" variant="ghost" className="text-destructive" disabled={busy} aria-label={`${t('delete')} ${skill}`} onClick={()=>void write(skills.filter(s=>s!==skill))}><Trash2 size={14}/></Button></div></CardContent></Card>)}{!loading&&!error&&!skills.length&&<p className="text-center text-muted-foreground py-8">{t('no_skills_yet')}</p>}</div><Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t(editing?'edit_skill':'add_skill')}</DialogTitle></DialogHeader><label htmlFor="canonical-skill" className="space-y-2 text-sm">{t('skill_name')}<Input id="canonical-skill" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label><DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setOpen(false)}>{t('cancel')}</Button><Button disabled={busy} onClick={save}>{t('save')}</Button></DialogFooter></DialogContent></Dialog></div>;
}
