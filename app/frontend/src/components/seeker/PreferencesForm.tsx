import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { JobExpertiseSelector, EmploymentTypeMultiSelect } from '@/components/shared/PreferenceSelectors';
import { CountryMultiSelector } from '@/components/shared/ProfileFields';
import { loadPreferences, savePreferences, type JobPreferences } from '@/lib/job-preferences';
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
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.userId) ?? 'seeker-1';
  const [prefs, setPrefs] = useState<JobPreferences>(() => loadPreferences(userId));
  const [error, setError] = useState<string | null>(null);
  // Onboarding writes the same record; re-read when another surface saves it.
  useEffect(() => {
    const h = () => setPrefs(loadPreferences(userId));
    window.addEventListener('matchme:preferences-changed', h);
    return () => window.removeEventListener('matchme:preferences-changed', h);
  }, [userId]);


  const save = () => {
    if (!prefs.expertise.length) { setError(t('pref_expertise_required')); return; }
    if (prefs.salaryMin && prefs.salaryMax && Number(prefs.salaryMin) > Number(prefs.salaryMax)) { setError(t('pref_salary_range_error')); return; }
    savePreferences(userId, prefs);
    trackEvent('preferences_saved', { expertise: prefs.expertise.length, types: prefs.employmentTypes });
    toast.success(t('preferences_saved'));
    onSaved?.(prefs);
  };

  const list = (v: string[]) => v.join(', ');
  const parse = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className={cn('space-y-5', compact && 'space-y-4')}>
      <section aria-labelledby="pref-exp-label">
        <Label id="pref-exp-label">{t('pref_expertise')} <span className="text-destructive">*</span></Label>
        <p className="text-xs text-muted-foreground mb-2">{t('pref_expertise_hint')}</p>
        <JobExpertiseSelector id="pref-exp" value={prefs.expertise} onChange={(v) => { setError(null); setPrefs((p) => ({ ...p, expertise: v })); }} invalid={!!error} signals={signals} />
        {error && <p role="alert" className="text-xs text-destructive mt-2">{error}</p>}
      </section>

      <section aria-labelledby="pref-type-label">
        <Label id="pref-type-label">{t('employment_type')}</Label>
        <div className="mt-2"><EmploymentTypeMultiSelect labelledBy="pref-type-label" value={prefs.employmentTypes} onChange={(v) => setPrefs((p) => ({ ...p, employmentTypes: v }))} /></div>
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
      <Button className="cursor-pointer w-full sm:w-auto h-11" onClick={save}>{t('save')}</Button>
    </div>
  );
}
