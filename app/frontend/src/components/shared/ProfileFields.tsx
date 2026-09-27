/**
 * Shared enterprise profile field components.
 * Mobile-first, RTL-safe (logical properties), keyboard accessible, i18n-only copy.
 * Used by Profile, Experience, Education, Certificates and onboarding.
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Search, X, Briefcase, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  loadCountries, loadCities, countryLabel, splitMonths, totalExperienceMonths,
  normalizeYearMonth, type GeoCountry, type DateRangeValue,
} from '@/lib/profile-standards';

// ============================================================
// Required indicator + field wrapper
// ============================================================

export function RequiredFieldIndicator() {
  const { t } = useTranslation();
  return (
    <>
      <span aria-hidden="true" className="text-destructive ms-0.5">*</span>
      <span className="sr-only"> ({t('pp_required')})</span>
    </>
  );
}

export function FormField({ id, label, required, error, hint, children, className }: {
  id: string; label: string; required?: boolean; error?: string; hint?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={className} data-field-error={error ? 'true' : undefined}>
      <Label htmlFor={id} className="flex items-center">{label}{required && <RequiredFieldIndicator />}</Label>
      {hint && <div id={`${id}-hint`} className="text-xs text-muted-foreground mt-1">{hint}</div>}
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-destructive mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />{t(error)}
        </p>
      )}
    </div>
  );
}

export function fieldAria(id: string, error?: string, hasHint?: boolean) {
  const describedBy = [error ? `${id}-error` : '', hasHint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
}

// ============================================================
// Generic searchable combobox (single + multi)
// ============================================================

interface Option { value: string; label: string }

function SearchableCombobox({ id, options, value, onChange, placeholder, disabled, invalid, loading, multiple, describedBy }: {
  id: string; options: Option[]; value: string[]; onChange: (v: string[]) => void;
  placeholder: string; disabled?: boolean; invalid?: boolean; loading?: boolean; multiple?: boolean; describedBy?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const base = ql ? options.filter((o) => o.label.toLowerCase().includes(ql) || o.value.toLowerCase() === ql) : options;
    return base.slice(0, 200);
  }, [q, options]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => { setActive(0); }, [q]);

  const pick = (v: string) => {
    if (multiple) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else { onChange([v]); setOpen(false); }
    setQ('');
  };

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { if (open && filtered[active]) { e.preventDefault(); pick(filtered[active].value); } }
    else if (e.key === 'Escape') { setOpen(false); }
    else if (e.key === 'Backspace' && multiple && !q && value.length) { onChange(value.slice(0, -1)); }
  };

  return (
    <div ref={root} className="relative">
      {multiple && value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2" aria-label={t('pp_selected_values')}>
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-medium ps-2.5 pe-1 py-1">
              {labelOf(v)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))}
                className="rounded-full p-1 hover:bg-primary/20 min-w-[28px] min-h-[28px] flex items-center justify-center"
                aria-label={t('pp_remove_value', { value: labelOf(v) })} disabled={disabled}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="text-xs text-muted-foreground underline px-1 min-h-[28px]" disabled={disabled}>
            {t('pp_clear_all')}
          </button>
        </div>
      )}
      <div className={cn('relative flex items-center rounded-md border bg-background', invalid ? 'border-destructive ring-1 ring-destructive/40' : 'border-input', disabled && 'opacity-50')}>
        <Search className="absolute start-3 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
          disabled={disabled}
          value={open ? q : (!multiple && value[0] ? labelOf(value[0]) : q)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={loading ? t('loading') : placeholder}
          className="w-full h-11 bg-transparent ps-9 pe-9 text-base sm:text-sm outline-none rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          autoComplete="off"
        />
        <ChevronDown className="absolute end-3 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      </div>
      {open && !disabled && (
        <ul id={listId} role="listbox" aria-multiselectable={multiple || undefined}
          className="absolute z-50 inset-x-0 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-md border bg-popover shadow-lg">
          {loading && <li className="p-3 text-sm text-muted-foreground">{t('loading')}</li>}
          {!loading && filtered.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t('ob_no_results')}</li>}
          {filtered.map((o, i) => {
            const sel = value.includes(o.value);
            return (
              <li key={o.value} id={`${id}-opt-${i}`} role="option" aria-selected={sel}
                onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer min-h-[44px]', i === active && 'bg-muted', sel && 'font-medium text-primary')}>
                <span className="truncate">{o.label}</span>
                {sel && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Countries hook (shared dataset)
// ============================================================

export function useCountries() {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    loadCountries().then((c) => alive && setCountries(c)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, []);
  return { countries, loading: countries.length === 0 && !error, error };
}

function useCountryOptions(): { options: Option[]; loading: boolean } {
  const { i18n } = useTranslation();
  const { countries, loading } = useCountries();
  const lang = i18n.language;
  const options = useMemo(() => countries
    .map((c) => ({ value: c.code, label: countryLabel(c.code, lang, c.en) }))
    .sort((a, b) => a.label.localeCompare(b.label, lang)), [countries, lang]);
  return { options, loading };
}

// ============================================================
// Country / City / Location / Nationality
// ============================================================

export function CountrySelector({ id, value, onChange, invalid, describedBy, disabled }: {
  id: string; value: string; onChange: (code: string) => void; invalid?: boolean; describedBy?: string; disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { options, loading } = useCountryOptions();
  return <SearchableCombobox id={id} options={options} loading={loading} value={value ? [value] : []}
    onChange={(v) => onChange(v[0] ?? '')} placeholder={t('pp_select_country')} invalid={invalid} describedBy={describedBy} disabled={disabled} />;
}

export function CitySelector({ id, country, value, onChange, invalid, describedBy }: {
  id: string; country: string; value: string; onChange: (city: string) => void; invalid?: boolean; describedBy?: string;
}) {
  const { t } = useTranslation();
  const [cities, setCities] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    setCities(null);
    if (country) loadCities(country).then((c) => alive && setCities(c));
    return () => { alive = false; };
  }, [country]);
  const options = useMemo(() => (cities ?? []).map((c) => ({ value: c, label: c })), [cities]);
  return <SearchableCombobox id={id} options={options} loading={!!country && cities === null} value={value ? [value] : []}
    onChange={(v) => onChange(v[0] ?? '')} disabled={!country}
    placeholder={country ? t('pp_select_city') : t('pp_select_country_first')} invalid={invalid} describedBy={describedBy} />;
}

/**
 * Country + dependent City. When the country changes, the city is validated
 * against the new country's list and cleared if it does not belong to it.
 */
export function LocationSelector({ idPrefix, country, city, onChange, errors, required = true }: {
  idPrefix: string; country: string; city: string;
  onChange: (next: { country: string; city: string }) => void;
  errors?: { country?: string; city?: string }; required?: boolean;
}) {
  const { t } = useTranslation();
  const changeCountry = async (code: string) => {
    if (code === country) return;
    if (!city || !code) { onChange({ country: code, city: '' }); return; }
    const list = await loadCities(code);
    onChange({ country: code, city: list.includes(city) ? city : '' });
  };
  const cId = `${idPrefix}-country`; const tId = `${idPrefix}-city`;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField id={cId} label={t('country')} required={required} error={errors?.country}>
        <CountrySelector id={cId} value={country} onChange={changeCountry} invalid={!!errors?.country} describedBy={errors?.country ? `${cId}-error` : undefined} />
      </FormField>
      <FormField id={tId} label={t('city')} required={required} error={errors?.city}>
        <CitySelector id={tId} country={country} value={city} onChange={(c) => onChange({ country, city: c })} invalid={!!errors?.city} describedBy={errors?.city ? `${tId}-error` : undefined} />
      </FormField>
    </div>
  );
}

export function NationalityMultiSelect({ id, value, onChange, invalid, describedBy }: {
  id: string; value: string[]; onChange: (codes: string[]) => void; invalid?: boolean; describedBy?: string;
}) {
  const { t } = useTranslation();
  const { options, loading } = useCountryOptions();
  return <SearchableCombobox id={id} multiple options={options} loading={loading} value={value}
    onChange={(v) => onChange([...new Set(v)])} placeholder={t('pp_select_nationality')} invalid={invalid} describedBy={describedBy} />;
}

// ============================================================
// Month / Year + DateRangeField
// ============================================================

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

function MonthYearInput({ id, value, onChange, disabled, invalid, label, minYear = 1950, maxYear }: {
  id: string; value: string; onChange: (v: string) => void; disabled?: boolean; invalid?: boolean; label: string; minYear?: number; maxYear: number;
}) {
  const { i18n, t } = useTranslation();
  const [y, m] = normalizeYearMonth(value).split('-');
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i)), [minYear, maxYear]);
  const monthName = (mm: string) => new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar' : 'en', { month: 'long' }).format(new Date(2000, Number(mm) - 1, 1));
  const set = (ny?: string, nm?: string) => {
    const year = ny ?? y; const month = nm ?? m;
    onChange(year && month ? `${year}-${month}` : year ? year : '');
  };
  const cls = cn('h-11', invalid && 'border-destructive');
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-2">
      <Select value={m || undefined} onValueChange={(v) => set(undefined, v)} disabled={disabled}>
        <SelectTrigger id={`${id}-month`} className={cls} aria-label={`${label} — ${t('pp_month')}`}><SelectValue placeholder={t('pp_month')} /></SelectTrigger>
        <SelectContent>{MONTHS.map((mm) => <SelectItem key={mm} value={mm}>{monthName(mm)}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={y || undefined} onValueChange={(v) => set(v, undefined)} disabled={disabled}>
        <SelectTrigger id={`${id}-year`} className={cls} aria-label={`${label} — ${t('pp_year')}`}><SelectValue placeholder={t('pp_year')} /></SelectTrigger>
        <SelectContent>{years.map((yy) => <SelectItem key={yy} value={yy}>{yy}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

/** Canonical From / To / Current control shared by all professional-history forms. */
export function DateRangeField({ idPrefix, value, onChange, errors, currentLabelKey = 'pp_current', toLabelKey = 'to', fromLabelKey = 'from', allowCurrent = true, futureYears = 0 }: {
  idPrefix: string; value: DateRangeValue; onChange: (v: DateRangeValue) => void;
  errors?: { from?: string; to?: string }; currentLabelKey?: string; toLabelKey?: string; fromLabelKey?: string;
  allowCurrent?: boolean; futureYears?: number;
}) {
  const { t } = useTranslation();
  const maxYear = new Date().getFullYear() + futureYears;
  const curId = useId();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id={`${idPrefix}-from-month`} label={t(fromLabelKey)} required error={errors?.from}>
          <MonthYearInput id={`${idPrefix}-from`} label={t(fromLabelKey)} value={value.from} invalid={!!errors?.from}
            maxYear={maxYear} onChange={(from) => onChange({ ...value, from })} />
        </FormField>
        <FormField id={`${idPrefix}-to-month`} label={t(toLabelKey)} required={!value.current} error={value.current ? undefined : errors?.to}>
          {value.current
            ? <div className="h-11 flex items-center px-3 rounded-md border border-dashed text-sm text-muted-foreground">{t('present')}</div>
            : <MonthYearInput id={`${idPrefix}-to`} label={t(toLabelKey)} value={value.to} invalid={!!errors?.to}
                maxYear={maxYear + 10} onChange={(to) => onChange({ ...value, to })} />}
        </FormField>
      </div>
      {allowCurrent && (
        <div className="flex items-center gap-3 min-h-[44px]">
          <Switch id={curId} checked={value.current} onCheckedChange={(c) => onChange({ ...value, current: c, to: c ? '' : value.to })} />
          <Label htmlFor={curId} className="cursor-pointer">{t(currentLabelKey)}</Label>
        </div>
      )}
    </div>
  );
}

/** Localized "Mar 2023" / "2021" display that never invents a missing month. */
export function formatYearMonth(ym: string, lang: string): string {
  const v = normalizeYearMonth(ym);
  if (!v) return '';
  const [y, m] = v.split('-');
  if (!m) return y;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { month: 'short', year: 'numeric' }).format(new Date(Number(y), Number(m) - 1, 1));
}

// ============================================================
// Total experience summary + word counter
// ============================================================

export function useExperienceDurationLabel(items: DateRangeValue[]): string {
  const { t } = useTranslation();
  const { years, months } = splitMonths(totalExperienceMonths(items));
  if (years === 0 && months === 0) return t('pp_total_none');
  const parts = [];
  if (years) parts.push(t('pp_years', { count: years }));
  if (months) parts.push(t('pp_months', { count: months }));
  return parts.join(' ');
}

export function ExperienceDurationSummary({ items }: { items: DateRangeValue[] }) {
  const { t } = useTranslation();
  const label = useExperienceDurationLabel(items);
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-3" data-testid="total-experience">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Briefcase className="w-5 h-5 text-primary" aria-hidden="true" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{t('pp_total_experience')}</p>
        <p className="font-semibold font-[Poppins]" aria-live="polite">{label}</p>
      </div>
    </div>
  );
}

export function WordCounter({ id, count, max }: { id: string; count: number; max: number }) {
  const { t } = useTranslation();
  const over = count > max;
  return (
    <p id={id} aria-live="polite" className={cn('text-xs text-end mt-1 tabular-nums', over ? 'text-destructive font-medium' : 'text-muted-foreground')}>
      {t('pp_word_count', { count, max })}{over && ` — ${t('pp_over_limit', { count: count - max })}`}
    </p>
  );
}

export { Input as FieldInput };
