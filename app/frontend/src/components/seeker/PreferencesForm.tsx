import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL_KEYS } from '@/lib/profile-standards';
import {
  expertiseLabel, loadPreferences, savePreferences, searchExpertise, suggestExpertise, type JobPreferences,
} from '@/lib/job-preferences';
import { trackEvent } from '@/lib/analytics';
import { useAuthStore } from '@/stores';

const MAX_EXPERTISE = 10;

interface Props {
  /** Career signals used for suggestions only; they are never auto-applied. */
  signals?: { skills: string[]; titles: string[]; fields: string[] };
  onSaved?: (p: JobPreferences) => void;
  compact?: boolean;
}

/** Canonical Job Seeker preferences editor, reused by Profile and Discover. */
export function PreferencesForm({ signals, onSaved, compact }: Props) {
  const { t, i18n } = useTranslation();
  const userId = useAuthStore((s) => (s as unknown as { userId?: string; session?: { user?: { id?: string } } }).userId ?? (s as unknown as { session?: { user?: { id?: string } } }).session?.user?.id) ?? 'seeker-1';
  const [prefs, setPrefs] = useState<JobPreferences>(() => loadPreferences(userId));
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lang = i18n.language;

  const results = useMemo(() => searchExpertise(query, lang).filter((e) => !prefs.expertise.includes(e.code)).slice(0, 8), [query, lang, prefs.expertise]);
  const suggestions = useMemo(() => signals ? suggestExpertise(signals, prefs.expertise) : [], [signals, prefs.expertise]);

  const toggleExpertise = (code: string) => {
    setError(null);
    setPrefs((p) => {
      if (p.expertise.includes(code)) return { ...p, expertise: p.expertise.filter((c) => c !== code) };
      if (p.expertise.length >= MAX_EXPERTISE) { toast.error(t('pref_max_expertise', { max: MAX_EXPERTISE })); return p; }
      return { ...p, expertise: [...p.expertise, code] };
    });
  };
  const toggleType = (code: JobPreferences['employmentTypes'][number]) =>
    setPrefs((p) => ({ ...p, employmentTypes: p.employmentTypes.includes(code) ? p.employmentTypes.filter((c) => c !== code) : [...p.employmentTypes, code] }));

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
        {prefs.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {prefs.expertise.map((c) => (
              <Badge key={c} className="gap-1 h-8 ps-3 pe-1">
                {expertiseLabel(c, lang)}
                <button type="button" onClick={() => toggleExpertise(c)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 cursor-pointer" aria-label={`${t('remove')} ${expertiseLabel(c, lang)}`}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('pref_search_expertise')} className="h-11 ps-9" aria-invalid={!!error || undefined} role="combobox" aria-expanded aria-controls="pref-exp-results" />
        </div>
        <ul id="pref-exp-results" role="listbox" className="mt-1 border rounded-md max-h-48 overflow-y-auto divide-y">
          {results.map((e) => (
            <li key={e.code} role="option" aria-selected={false}>
              <button type="button" onClick={() => toggleExpertise(e.code)} className="w-full min-h-11 px-3 py-2 text-sm text-start hover:bg-muted flex justify-between gap-2 cursor-pointer">
                <span>{expertiseLabel(e.code, lang)}</span><span className="text-xs text-muted-foreground truncate">{e.group}</span>
              </button>
            </li>
          ))}
          {!results.length && <li className="px-3 py-3 text-sm text-muted-foreground">{t('no_results')}</li>}
        </ul>
        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium flex items-center gap-1 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" />{t('pref_suggested')}</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <Button key={s.code} type="button" size="sm" variant="outline" className="h-9 cursor-pointer" onClick={() => toggleExpertise(s.code)}>+ {expertiseLabel(s.code, lang)}</Button>
              ))}
            </div>
          </div>
        )}
        {error && <p role="alert" className="text-xs text-destructive mt-2">{error}</p>}
      </section>

      <section aria-labelledby="pref-type-label">
        <Label id="pref-type-label">{t('employment_type')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {EMPLOYMENT_TYPES.map((c) => {
            const on = prefs.employmentTypes.includes(c);
            return (
              <button key={c} type="button" role="checkbox" aria-checked={on} onClick={() => toggleType(c)} className={cn('min-h-11 rounded-lg border px-3 text-sm flex items-center gap-2 cursor-pointer', on ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted')}>
                <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', on ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>{on && <Check className="w-3 h-3 text-primary-foreground" />}</span>
                {t(EMPLOYMENT_TYPE_LABEL_KEYS[c])}
              </button>
            );
          })}
        </div>
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
