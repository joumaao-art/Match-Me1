/**
 * Canonical preference selectors shared by Profile → Preferences and
 * Job Seeker onboarding. One taxonomy, one employment-type enum.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL_KEYS, type EmploymentTypeCode } from '@/lib/profile-standards';
import { expertiseLabel, searchExpertise, suggestExpertise } from '@/lib/job-preferences';

export const MAX_EXPERTISE = 10;

/** Type-ahead multi-select over the canonical job/expertise taxonomy. */
export function JobExpertiseSelector({ id, value, onChange, invalid, signals, max = MAX_EXPERTISE }: {
  id: string; value: string[]; onChange: (codes: string[]) => void; invalid?: boolean;
  /** Profile signals for suggestions. Suggestions are shown only, never auto-selected. */
  signals?: { skills: string[]; titles: string[]; fields: string[] };
  max?: number;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchExpertise(query, lang).filter((e) => !value.includes(e.code)).slice(0, 8), [query, lang, value]);
  const suggestions = useMemo(() => (signals ? suggestExpertise(signals, value) : []), [signals, value]);
  const add = (code: string) => { if (value.length < max && !value.includes(code)) onChange([...value, code]); setQuery(''); };
  const listId = `${id}-results`;

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-sm font-medium ps-3 pe-1 py-1">
              {expertiseLabel(c, lang)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== c))} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary/20 cursor-pointer" aria-label={t('pp_remove_value', { value: expertiseLabel(c, lang) })}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input id={id} value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) { e.preventDefault(); add(results[0].code); } if (e.key === 'Escape') setOpen(false); }}
          placeholder={t('pref_search_expertise')} className={cn('h-11 ps-9', invalid && 'border-destructive')}
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-invalid={invalid || undefined} disabled={value.length >= max} />
        {open && (
          <ul id={listId} role="listbox" className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
            {results.map((e) => (
              <li key={e.code} role="option" aria-selected={false}>
                <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => add(e.code)} className="w-full min-h-11 px-3 py-2 text-sm text-start hover:bg-muted flex justify-between gap-2 cursor-pointer">
                  <span>{expertiseLabel(e.code, lang)}</span><span className="text-xs text-muted-foreground truncate">{e.group}</span>
                </button>
              </li>
            ))}
            {!results.length && <li className="px-3 py-3 text-sm text-muted-foreground">{t('no_results')}</li>}
          </ul>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium flex items-center gap-1 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" />{t('pref_suggested')}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <Button key={s.code} type="button" size="sm" variant="outline" className="h-9 cursor-pointer" onClick={() => add(s.code)}>+ {expertiseLabel(s.code, lang)}</Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Multi-select over the canonical Employment Type enum (the same list as Experience). */
export function EmploymentTypeMultiSelect({ value, onChange, labelledBy }: {
  value: EmploymentTypeCode[]; onChange: (v: EmploymentTypeCode[]) => void; labelledBy?: string;
}) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {EMPLOYMENT_TYPES.map((c) => {
        const on = value.includes(c);
        return (
          <button key={c} type="button" role="checkbox" aria-checked={on} onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            className={cn('min-h-11 rounded-lg border px-3 text-sm flex items-center gap-2 cursor-pointer', on ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted')}>
            <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', on ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>{on && <Check className="w-3 h-3 text-primary-foreground" />}</span>
            {t(EMPLOYMENT_TYPE_LABEL_KEYS[c])}
          </button>
        );
      })}
    </div>
  );
}
