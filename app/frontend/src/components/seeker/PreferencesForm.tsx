import { MobileSearch } from '@/components/onboarding/MobileControls';
import { MOBILE_WORK_TYPES, SENIORITY, WORKING_STYLES } from '@/lib/mobile-onboarding-options';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { JobExpertiseSelector, EmploymentTypeMultiSelect } from '@/components/shared/PreferenceSelectors';
import { CountryMultiSelector } from '@/components/shared/ProfileFields';
import { apiClient } from '@/services/api-client';
import { loadPreferences, migrateLegacyPreferences, savePreferences, type JobPreferences } from '@/lib/job-preferences';
import { trackEvent } from '@/lib/analytics';
import { useAuthStore } from '@/stores';


interface Props {
  /** Career signals used for suggestions only; they are never auto-applied. */
  signals?: { skills: string[]; titles: string[]; fields: string[] };
  onSaved?: (p: JobPreferences) => void;
  compact?: boolean;
}

/** Canonical Job Seeker preferences editor, reused by Profile and Discover. */
export function PreferencesForm({ signals, onSaved, compact }: Props) {
  const { t,i18n } = useTranslation();
  const isMobile=useIsMobile();const ar=i18n.language.startsWith('ar');
  const userId = useAuthStore((s) => s.userId) ?? '';
  const mounted=useRef(false);const saving=useRef(false);const edited=useRef(false);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const [prefs, setPrefs] = useState<JobPreferences>(() => loadPreferences(userId));
  const [error, setError] = useState<string | null>(null);
  // Onboarding writes the same record; re-read when another surface saves it.
  useEffect(() => {
    let alive = true;
    edited.current=false;
    setPrefs(loadPreferences(userId));
    void apiClient.supabase.from('job_seeker_profiles').select('job_preferences').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)).maybeSingle().then(r => { if (alive && !edited.current && useAuthStore.getState().userId===userId && !r.error && r.data) { const next = migrateLegacyPreferences(r.data.job_preferences||{}); setPrefs(next);savePreferences(userId, next); } });
    const h = () => setPrefs(loadPreferences(userId));
    window.addEventListener('matchme:preferences-changed', h);
    return () => { alive = false; window.removeEventListener('matchme:preferences-changed', h); };
  }, [userId]);


  const save = async () => {
    if(!userId||saving.current||useAuthStore.getState().userId!==userId)return;
    if (!prefs.expertise.length) { setError(t('pref_expertise_required')); return; }
    if (prefs.salaryMin && prefs.salaryMax && Number(prefs.salaryMin) > Number(prefs.salaryMax)) { setError(t('pref_salary_range_error')); return; }
    saving.current=true;setBusy(true);setError(null);
    const snapshot=structuredClone(prefs);
    if(isMobile)snapshot.employmentTypes=snapshot.employmentTypes.filter(v=>MOBILE_WORK_TYPES.some(o=>o.code===v));
    const owned=()=>mounted.current&&useAuthStore.getState().userId===userId;
    try {
      const existing = await apiClient.supabase.from('job_seeker_profiles').select('job_preferences').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)).single();
      if(existing.error)throw existing.error;
      if(!owned())return;
      const saved = await apiClient.supabase.from('job_seeker_profiles').update({ job_preferences: { ...existing.data.job_preferences, ...snapshot } }).eq('user_id', userId).select('user_id').abortSignal(AbortSignal.timeout(10000)).single();
      if(saved.error)throw saved.error;
      if(!owned())return;
      setPrefs(snapshot);savePreferences(userId, snapshot);
      trackEvent('preferences_saved', { expertise: snapshot.expertise.length, types: snapshot.employmentTypes });
      toast.success(t('preferences_saved'));onSaved?.(snapshot);
    }catch{if(owned())setError(t('pp_save_error'));}
    finally{saving.current=false;if(owned())setBusy(false);}
  };

  const list = (v: string[]) => v.join(', ');
  const parse = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <fieldset disabled={busy} onChangeCapture={()=>{edited.current=true;}} onClickCapture={()=>{edited.current=true;}} className={cn('space-y-5', compact && 'space-y-4')}>
      <section aria-labelledby="pref-exp-label">
        <Label id="pref-exp-label">{t('pref_expertise')} <span className="text-destructive">*</span></Label>
        <p className="text-xs text-muted-foreground mb-2">{t('pref_expertise_hint')}</p>
        <JobExpertiseSelector id="pref-exp" value={prefs.expertise} onChange={(v) => { setError(null); setPrefs((p) => ({ ...p, expertise: v })); }} invalid={!!error} signals={signals} />
        {error && <p role="alert" className="text-xs text-destructive mt-2">{error}</p>}
      </section>

      {isMobile&&<section className="space-y-4"><div><Label>{ar?'الكلمات المفتاحية':'Keywords'}</Label><MobileSearch id="pref-keywords" label={ar?'الكلمات المفتاحية':'Keywords'} options={[]} value={prefs.keywords} multiple custom lang={ar?'ar':'en'} onChange={keywords=>setPrefs(p=>({...p,keywords}))}/></div>{[{title:ar?'أسلوب العمل':'Working style',options:WORKING_STYLES,field:'workingStyles' as const},{title:ar?'مستويات الخبرة':'Seniority levels',options:SENIORITY,field:'seniorityLevels' as const}].map(group=><fieldset key={group.field}><legend className="text-sm font-medium mb-2">{group.title}</legend><div className="flex flex-wrap gap-2">{group.options.map(o=><button key={o.code} type="button" role="checkbox" aria-checked={prefs[group.field].includes(o.code)} className={cn('min-h-11 px-3 border rounded-lg text-sm',prefs[group.field].includes(o.code)?'bg-primary text-primary-foreground':'bg-background text-foreground')} onClick={()=>setPrefs(p=>({...p,[group.field]:p[group.field].includes(o.code)?p[group.field].filter(v=>v!==o.code):[...p[group.field],o.code]}))}>{ar?o.ar:o.en}</button>)}</div></fieldset>)}</section>}
      <section aria-labelledby="pref-type-label">
        <Label id="pref-type-label">{t('employment_type')}</Label>
        <div className="mt-2">{isMobile?<div className="flex flex-wrap gap-2" aria-labelledby="pref-type-label">{MOBILE_WORK_TYPES.map(o=><button key={o.code} type="button" role="checkbox" aria-checked={prefs.employmentTypes.includes(o.code)} className={cn('min-h-11 px-3 border rounded-lg text-sm',prefs.employmentTypes.includes(o.code)?'bg-primary text-primary-foreground':'bg-background text-foreground')} onClick={()=>setPrefs(p=>({...p,employmentTypes:p.employmentTypes.includes(o.code)?p.employmentTypes.filter(v=>v!==o.code):[...p.employmentTypes,o.code]}))}>{ar?o.ar:o.en}</button>)}</div>:<EmploymentTypeMultiSelect labelledBy="pref-type-label" value={prefs.employmentTypes} onChange={(v) => setPrefs((p) => ({ ...p, employmentTypes: v }))} />}</div>
      </section>

      <section>
        <Label htmlFor="pref-countries">{t('ob_target_title')}</Label>
        <div className="mt-1"><CountryMultiSelector id="pref-countries" value={prefs.targetCountries} onChange={(v) => setPrefs((p) => ({ ...p, targetCountries: v }))} /></div>
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label htmlFor="pref-ind">{t('preferred_industries')}</Label><Input id="pref-ind" className="mt-1 h-11" defaultValue={list(prefs.industries)} onBlur={(e) => setPrefs((p) => ({ ...p, industries: parse(e.target.value) }))} /></div>
        <div><Label htmlFor="pref-loc">{t('preferred_locations')}</Label><Input id="pref-loc" className="mt-1 h-11" defaultValue={list(prefs.locations)} onBlur={(e) => setPrefs((p) => ({ ...p, locations: parse(e.target.value) }))} /></div>
        <div><Label htmlFor="pref-min">{t('min_salary')}</Label><Input id="pref-min" type="number" inputMode="numeric" min={0} className="mt-1 h-11" value={prefs.salaryMin} onChange={(e) => setPrefs((p) => ({ ...p, salaryMin: e.target.value }))} /></div>
        <div><Label htmlFor="pref-max">{t('max_salary')}</Label><Input id="pref-max" type="number" inputMode="numeric" min={0} className="mt-1 h-11" value={prefs.salaryMax} onChange={(e) => setPrefs((p) => ({ ...p, salaryMax: e.target.value }))} /></div>
      </div>
      <div className="flex items-center gap-3"><Switch id="pref-rel" checked={prefs.willingToRelocate} onCheckedChange={(v) => setPrefs((p) => ({ ...p, willingToRelocate: v }))} /><Label htmlFor="pref-rel">{t('willing_to_relocate')}</Label></div>
      <Button disabled={busy||!userId} className="cursor-pointer w-full sm:w-auto h-11" onClick={save}>{t('save')}</Button>
    </fieldset>
  );
}
