import { DesktopAccountFeatures } from './DesktopAccountFeatures';
import { MandatoryProfileGuidance } from './MandatoryProfileGuidance';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { profileReady, historyReady, retainHistoryBase, readHistory, writeHistory, readCanonicalProfile, writeCanonicalProfile } from '@/lib/canonical-profile';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { Sliders } from 'lucide-react';
/**
 * Job Seeker professional profile views: Profile (+ Resume & CV),
 * Experience, Education (+ Certificates) and Languages.
 *
 * All validation, enums, ordering and duration math come from
 * `@/lib/profile-standards`; all field controls come from
 * `@/components/shared/ProfileFields`. Records are persisted per user and
 * normalized on read so legacy values (e.g. "Full-time", "advanced",
 * year-only dates, GPA) remain accessible without destructive changes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  User, FileText, Upload, Download, Trash2, Plus, Edit, Calendar, Award, Check,
  Languages as LanguagesIcon, MapPin, AlertTriangle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import {
  FormField, fieldAria, LocationSelector, NationalityMultiSelect, DateRangeField,
  ExperienceDurationSummary, WordCounter, formatYearMonth, useCountries,
} from '@/components/shared/ProfileFields';
import {
  EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABEL_KEYS, DEGREES, DEGREE_LABEL_KEYS,
  LANGUAGE_LEVELS, LANGUAGE_LEVEL_LABEL_KEYS, EXPERIENCE_DESCRIPTION_MAX_WORDS,
  countWords, countryLabel, normalizeExperience, normalizeEducation, normalizeLanguageLevel,
  normalizeYearMonth, resolveCountryCode, resolveNationalities, sortChronological, sortCertificates,
  validateCertificate, validateEducation, validateExperience, validateProfile,
  type CertificateRecord, type EducationRecord, type ExperienceRecord, type LanguageRecord,
  type SeekerProfileRecord, type FieldErrors,
} from '@/lib/profile-standards';

// ============================================================
// Persistence (per user, normalized on read)
// ============================================================

type SaveState = 'IDLE' | 'VALIDATING' | 'SAVING' | 'SUCCESS' | 'ERROR';

function storageKey(userId: string | null | undefined, name: string) {
  return `matchme-profile:${userId ?? 'anon'}:${name}`;
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

/** Bounded write: always settles within 5s so Save can never hang. */
function persist(key: string, value: unknown): Promise<void> {
  return Promise.race([
    new Promise<void>((resolve, reject) => {
      try { localStorage.setItem(key, JSON.stringify(value)); resolve(); } catch (e) { reject(e); }
    }),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('save timeout')), 5000)),
  ]);
}

function usePersistedList<T>(name: string, seed: T[], normalize: (x: T) => T) {
  const userId = useAuthStore((s) => s.userId);
  const key = storageKey(userId, name);
  const fallback = userId ? [] : seed;
  const [items, setItems] = useState<T[]>(() => readStored<T[]>(key, fallback).map(normalize));
  const mutation = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, [userId]);
  useEffect(() => {
    let alive = true;
    const cached=readStored<T[]>(key,userId?[]:seed).map(normalize);
    const isDemo=JSON.stringify(cached)===JSON.stringify(seed.map(normalize));
    const local=userId&&isDemo?[]:cached;
    setItems(local);
    if (userId) void readHistory(name, userId).then(rows => { if (alive && rows !== null && useAuthStore.getState().userId===userId) { const next = (rows as T[]).map(normalize); retainHistoryBase(rows,next); setItems(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Server records remain authoritative. */ } } }).catch(() => toast.error('Unable to load saved profile records.'));
    const refresh=()=>{if(mutation.current||document.querySelector('[role="dialog"]'))return;if(userId)void readHistory(name,userId).then(rows=>{if(alive&&rows!==null&&useAuthStore.getState().userId===userId&&!mutation.current&&!document.querySelector('[role="dialog"]')){const next=(rows as T[]).map(normalize);retainHistoryBase(rows,next);setItems(next);}}).catch(()=>{if(alive)toast.error('Unable to refresh profile records.');});};
    window.addEventListener('focus',refresh);window.addEventListener('matchme:profile-changed',refresh);
    return () => { alive = false;window.removeEventListener('focus',refresh);window.removeEventListener('matchme:profile-changed',refresh); };
  }, [key, userId, name]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = useCallback(async (next: T[]) => {
    if (!userId || !historyReady(items)) throw new Error('Reload saved profile records before editing');
    if (mutation.current) throw new Error('A profile save is already in progress');
    mutation.current = true;
    try {
      await writeHistory(name, userId, next, items);
      if (!alive.current || useAuthStore.getState().userId !== userId) throw new Error('Account changed');
      try { await persist(key, next); } catch { /* Server acknowledgement is authoritative. */ }
      if (!alive.current || useAuthStore.getState().userId !== userId) return;
      setItems(next);
      window.dispatchEvent(new Event('matchme:profile-changed'));
    } finally { mutation.current = false; }
  }, [key, userId, name, items]);
  return [items, commit] as const;
}

/** Deterministic save runner: IDLE → VALIDATING → SAVING → SUCCESS | ERROR. */
function useSaveRunner() {
  const [state, setState] = useState<SaveState>('IDLE');
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const run = useCallback(async (validate: () => boolean, save: () => Promise<void>, messages: { ok: string; err: string }) => {
    if (lock.current) return false;
    const owner = useAuthStore.getState().userId;
    const current = () => alive.current && useAuthStore.getState().userId === owner;
    lock.current = true;
    setState('VALIDATING');
    if (!validate()) { setState('ERROR'); lock.current = false; return false; }
    setState('SAVING');
    try {
      await save();
      if (!current()) return false;
      setState('SUCCESS'); toast.success(messages.ok); return true;
    } catch {
      if (current()) { setState('ERROR'); toast.error(messages.err); }
      return false;
    } finally { lock.current = false; }
  }, []);
  return { state, run, reset: () => setState('IDLE'), busy: state === 'SAVING' || state === 'VALIDATING' };
}

function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

function hasErrors(e: object) { return Object.keys(e).length > 0; }

function focusFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector('[data-field-error="true"] input, [data-field-error="true"] textarea, [data-field-error="true"] button');
    (el as HTMLElement | null)?.focus();
  });
}

// ============================================================
// Seed data (demo account) — normalized through the same read path
// ============================================================

const SEED_PROFILE: SeekerProfileRecord = {
  firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed@example.com', mobile: '+971501234567',
  country: 'UAE', city: 'Dubai', nationalities: ['Egyptian'], dob: '1995-03-15', photoUrl: '',
  headline: 'Senior Frontend Developer | React & TypeScript Expert',
  summary: 'Passionate frontend developer with 5+ years of experience building scalable web applications.',
  openToWork: true,
};

export const SEED_EXPERIENCE = [
  { id: '1', company: 'StartupX', title: 'Frontend Developer', type: 'Full-time', from: '2023-01', to: '2026-07', current: true, description: 'Building modern web applications with React and TypeScript.', country: 'AE', city: 'Dubai' },
  { id: '2', company: 'WebAgency', title: 'Junior Developer', type: 'Full-time', from: '2021-06', to: '2023-01', current: false, description: 'Developed responsive websites and e-commerce platforms.', country: '', city: '' },
] as unknown as ExperienceRecord[];

const SEED_EDUCATION = [
  { id: '1', institution: 'University of Dubai', degree: "Bachelor's", field: 'Computer Science', from: '2017', to: '2021', current: false, grade: '3.8 GPA' },
] as unknown as EducationRecord[];

const SEED_CERTIFICATES: CertificateRecord[] = [
  { id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2025-03', expiry: '2028-03', verified: true },
  { id: '2', name: 'React Advanced Patterns', issuer: 'Frontend Masters', date: '2024-11', expiry: null, verified: true },
];

const SEED_LANGUAGES = [
  { id: '1', name: 'Arabic', level: 'native' },
  { id: '2', name: 'English', level: 'advanced' },
  { id: '3', name: 'French', level: 'intermediate' },
] as unknown as LanguageRecord[];

const normCert = (c: CertificateRecord): CertificateRecord => ({
  ...c, date: normalizeYearMonth(c.date), expiry: c.expiry ? normalizeYearMonth(c.expiry) : null,
});
const normLang = (l: LanguageRecord): LanguageRecord => ({ ...l, level: normalizeLanguageLevel(l.level) });

/** Shared read hooks, also consumed by the dashboard, profile completion and AI adapters. */
export function useSeekerPortfolio() { return usePersistedList<{id:string;title:string;desc:string;url:string}>('portfolio', [], x=>x); }
export function useSeekerExperience() { return usePersistedList<ExperienceRecord>('experience', SEED_EXPERIENCE, normalizeExperience); }
export function useSeekerEducation() { return usePersistedList<EducationRecord>('education', SEED_EDUCATION, normalizeEducation); }
export function useSeekerCertificates() { return usePersistedList<CertificateRecord>('certificates', SEED_CERTIFICATES, normCert); }
export function useSeekerLanguages() { return usePersistedList<LanguageRecord>('languages', SEED_LANGUAGES, normLang); }

export function useSeekerProfile(dirtyGuard?:React.MutableRefObject<boolean>) {
  const userId = useAuthStore((s) => s.userId);
  const key = storageKey(userId, 'profile');
  const { countries } = useCountries();
  const emptyProfile: SeekerProfileRecord = {firstName:'',lastName:'',email:'',mobile:'',country:'',city:'',nationalities:[],dob:'',photoUrl:'',headline:'',summary:'',openToWork:true};
  const [profile, setProfile] = useState<SeekerProfileRecord>(() => readStored(key, userId ? emptyProfile : SEED_PROFILE));
  useEffect(() => {
    let alive = true; setProfile(readStored(key, userId ? emptyProfile : SEED_PROFILE));
    if (userId) void readCanonicalProfile(userId).then(next => { if (alive && useAuthStore.getState().userId===userId && !dirtyGuard?.current) { setProfile(next); try {localStorage.setItem(key, JSON.stringify(next));} catch { /* Saved server profile remains authoritative. */ } } }).catch(() => toast.error('Unable to load saved profile.'));
    const refresh=()=>{if(dirtyGuard?.current)return;if(userId)void readCanonicalProfile(userId).then(next=>{if(alive&&useAuthStore.getState().userId===userId&&!dirtyGuard?.current)setProfile(next);}).catch(()=>{if(alive)toast.error('Unable to refresh saved profile.');});};
    window.addEventListener('focus',refresh);window.addEventListener('matchme:profile-changed',refresh);
    return () => { alive = false;window.removeEventListener('focus',refresh);window.removeEventListener('matchme:profile-changed',refresh); };
  }, [key, userId]);
  // Legacy free text ("UAE", "Egyptian") → ISO codes once the country index is available.
  const normalized = useMemo<SeekerProfileRecord>(() => {
    if (!countries.length) return profile;
    const country = /^[A-Z]{2}$/.test(profile.country) ? profile.country : resolveCountryCode(profile.country, countries);
    const nats = resolveNationalities(profile.nationalities ?? [], countries);
    return { ...profile, country, city: country ? profile.city : '', nationalities: nats };
  }, [profile, countries]);
  const save = useCallback(async (next: SeekerProfileRecord) => { if(!userId)throw new Error('Authentication required'); await writeCanonicalProfile(userId,next,profile); if(useAuthStore.getState().userId!==userId)throw new Error('Account changed'); try {await persist(key,next);} catch { /* Confirmed server data remains saved. */ } setProfile(next); window.dispatchEvent(new Event('matchme:profile-changed')); }, [key, userId,profile]);
  return [normalized, save, countries.length > 0 && profileReady(profile)] as const;
}

// ============================================================
// Shared UI helpers
// ============================================================

function IncompleteBanner({ count }: { count: number }) {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-medium text-sm">{t('pp_incomplete_title')}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t('pp_incomplete_desc')}</p>
      </div>
    </div>
  );
}

function SaveButton({ busy, onClick, label }: { busy: boolean; onClick: () => void; label?: string }) {
  const { t } = useTranslation();
  return (
    <Button onClick={onClick} disabled={busy} className="cursor-pointer min-h-[44px] gap-2" aria-busy={busy}>
      {busy && <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" aria-hidden="true" />}
      {busy ? t('pp_saving') : (label ?? t('save'))}
    </Button>
  );
}

function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-3 justify-between items-center">
      <h2 className="text-xl font-bold font-[Poppins]">{title}</h2>
      {onAdd && <Button className="cursor-pointer gap-2 min-h-[44px]" onClick={onAdd}><Plus className="w-4 h-4" />{addLabel}</Button>}
    </div>
  );
}

/** Dialog wrapper with a sticky, always-reachable footer and an unsaved-change guard. */
function RecordDialog({ open, onClose, title, dirty, busy, children, footer }: {
  open: boolean; onClose: () => void; title: string; dirty: boolean; busy: boolean; children: React.ReactNode; footer: React.ReactNode;
}) {
  const { t } = useTranslation();
  const tryClose = () => { if (!busy && (!dirty || window.confirm(t('pp_unsaved_confirm')))) onClose(); };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) tryClose(); }}>
      <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] max-h-[90dvh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0"><DialogTitle className="font-[Poppins]">{title}</DialogTitle></DialogHeader>
        <fieldset disabled={busy} aria-busy={busy} className={cn('flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-4', busy && 'pointer-events-none')}>{children}</fieldset>
        <DialogFooter className="shrink-0 border-t px-5 py-3 flex-row justify-end gap-2 bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
          <Button variant="outline" disabled={busy} onClick={tryClose} className="cursor-pointer min-h-[44px]">{t('cancel')}</Button>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void | Promise<void>; label: string }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const remove = async () => {
    if (lock.current || !window.confirm(`${t('delete')} ${label}?`)) return;
    lock.current = true; setBusy(true);
    try { await onDelete(); } catch { toast.error(t('pp_save_error')); }
    finally { lock.current = false; setBusy(false); }
  };
  return (
    <div className="flex gap-1 shrink-0">
      <Button disabled={busy} size="icon" variant="ghost" className="cursor-pointer h-11 w-11" onClick={onEdit} aria-label={`${t('edit')} ${label}`}><Edit className="w-4 h-4" /></Button>
      <Button disabled={busy} size="icon" variant="ghost" className="cursor-pointer h-11 w-11 text-destructive" onClick={() => void remove()} aria-label={`${t('delete')} ${label}`}><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
}

function useFormState<T>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const base = useRef(JSON.stringify(initial));
  const reset = (v: T) => { base.current = JSON.stringify(v); setForm(v); };
  return { form, setForm, reset, dirty: JSON.stringify(form) !== base.current };
}

// ============================================================
// Profile (+ Resume & CV)
// ============================================================

export function ProfileView({ completion, onOpenPreferences }: { completion?: React.ReactNode; onOpenPreferences?: () => void }) {
  const location=useLocation();const mobile=useIsMobile();
  const { t,i18n } = useTranslation();
  const dirtyGuard=useRef(false);
  const [stored, save, ready] = useSeekerProfile(dirtyGuard);
  const { form: profile, setForm: setProfile, reset, dirty } = useFormState<SeekerProfileRecord>(stored);
  dirtyGuard.current=dirty;
  const [errors, setErrors] = useState<ReturnType<typeof validateProfile>>({});
  const saver = useSaveRunner();
  useUnsavedGuard(dirty);

  // Re-sync when the stored/normalized profile becomes available, and
  // highlight missing required fields for profiles predating this standard.
  useEffect(() => { if (ready && !dirty) { reset(stored); setErrors(validateProfile(stored)); } }, [ready, stored]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof SeekerProfileRecord>(k: K, v: SeekerProfileRecord[K]) => {
    setProfile((p) => ({ ...p, [k]: v }));
    if (errors[k as keyof typeof errors]) setErrors((e) => { const n = { ...e }; delete n[k as keyof typeof e]; return n; });
  };

  const onSave = () => saver.run(
    () => { const e = validateProfile(profile); setErrors(e); if (hasErrors(e)) { toast.error(t('pp_err_fix_fields')); focusFirstError(); } return !hasErrors(e); },
    async () => { await save(profile); reset(profile); },
    { ok: t('profile_saved'), err: t('pp_save_error') },
  );

  const text = (k: 'firstName' | 'lastName' | 'mobile' | 'headline', labelKey: string, extra?: object) => (
    <FormField id={`pf-${k}`} label={t(labelKey)} required={k!=='headline'} error={errors[k]}>
      <Input {...fieldAria(`pf-${k}`, errors[k])} value={profile[k]} onChange={(e) => set(k, e.target.value)} className={cn('h-11', errors[k] && 'border-destructive')} {...extra} />
    </FormField>
  );

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto pb-28 lg:pb-6">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('profile')}</h2>
      <div className="max-w-2xl space-y-6">
        {mobile&&new URLSearchParams(location.search).has('complete')&&<MandatoryProfileGuidance/>}
        {completion}
        <IncompleteBanner count={Object.keys(errors).length} />
        <Card><CardContent className="p-4 sm:p-6 space-y-4">
          {!ready&&<div className="space-y-2"><p role="status" className="text-sm text-muted-foreground">{i18n.language.startsWith('ar')?'الملف المحفوظ لم يصبح جاهزاً بعد. أعد المحاولة إذا استمر التحميل.':'Saved profile is not ready yet. Retry if loading does not finish.'}</p><Button variant="outline" onClick={()=>window.dispatchEvent(new Event('matchme:profile-changed'))}>{t('try_again')}</Button></div>}
          <fieldset disabled={!ready||saver.busy} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="w-10 h-10 text-primary" aria-hidden="true" /></div>
            <div>
              <Button variant="outline" size="sm" disabled className="min-h-[40px]">{t('upload_photo')}</Button><p className="text-xs text-muted-foreground">{i18n.language.startsWith('ar')?'تخزين الصور غير مُعدّ.':'Photo storage is not configured.'}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('photo_hint')} · {t('pp_photo_optional')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {text('firstName', 'first_name', { autoComplete: 'given-name' })}
            {text('lastName', 'last_name', { autoComplete: 'family-name' })}
            <FormField id="pf-email" label={t('email')} required><Input id="pf-email" value={profile.email} className="h-11" disabled /></FormField>
            <FormField id="pf-mobile" label={t('mobile')} required error={errors.mobile ? t(errors.mobile) : undefined}><PhoneInput id="pf-mobile" value={profile.mobile} onChange={(v) => set('mobile', v)} invalid={!!errors.mobile} /></FormField>
            {onOpenPreferences && <Button type="button" variant="outline" className="h-11 sm:col-span-2 cursor-pointer gap-2" onClick={onOpenPreferences}><Sliders className="w-4 h-4" />{t('pref_manage')}</Button>}
          </div>
          <LocationSelector idPrefix="pf" country={profile.country} city={profile.city}
            errors={{ country: errors.country, city: errors.city }}
            onChange={({ country, city }) => { setProfile((p) => ({ ...p, country, city })); setErrors((e) => { const n = { ...e }; if (country) delete n.country; if (city) delete n.city; return n; }); }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="pf-nat" label={t('nationality')} required error={errors.nationalities} hint={t('pp_nationality_hint')}>
              <NationalityMultiSelect id="pf-nat" value={profile.nationalities} onChange={(v) => set('nationalities', v)} invalid={!!errors.nationalities}
                describedBy={[errors.nationalities ? 'pf-nat-error' : '', 'pf-nat-hint'].filter(Boolean).join(' ')} />
            </FormField>
            <FormField id="pf-dob" label={`${t('date_of_birth')} (${t('pp_optional')})`}>
              <Input id="pf-dob" type="date" value={profile.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('dob', e.target.value)} className="h-11" />
            </FormField>
          </div>
          {text('headline', 'headline')}
          <FormField id="pf-summary" label={t('professional_summary')}>
            <Textarea {...fieldAria('pf-summary', errors.summary)} value={profile.summary} onChange={(e) => set('summary', e.target.value)} rows={4} className={cn(errors.summary && 'border-destructive')} />
          </FormField>
          <div className="flex items-center gap-3 min-h-[44px]">
            <Switch id="pf-open" checked={profile.openToWork} onCheckedChange={(v) => set('openToWork', v)} />
            <Label htmlFor="pf-open" className="cursor-pointer">{t('open_to_work')}</Label>
          </div>
          <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-card/95 backdrop-blur border-t sm:border-0 sm:static">
            <SaveButton busy={saver.busy||!ready} onClick={onSave} />
          </div>
          </fieldset>
        </CardContent></Card>
        {!mobile && <DesktopAccountFeatures section="overview" embedded/>}
      </div>
    </div>
  );
}

// ============================================================
// Resume & CV (moved from the standalone Resume page — same capability)
// ============================================================

export function ResumeSection() { return <DesktopAccountFeatures section="overview" embedded/>; }

// ============================================================
// Experience
// ============================================================

const EMPTY_EXP: Omit<ExperienceRecord, 'id'> = { title: '', company: '', type: '', country: '', city: '', from: '', to: '', current: false, description: '' };

export function ExperienceView() {
  const { t, i18n } = useTranslation();
  const [items, commit] = useSeekerExperience();
  const sorted = useMemo(() => sortChronological(items), [items]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { form, setForm, reset, dirty } = useFormState(EMPTY_EXP);
  const [errors, setErrors] = useState<FieldErrors<string>>({});
  const saver = useSaveRunner();
  const words = countWords(form.description);

  const openWith = (id: string | null, v: Omit<ExperienceRecord, 'id'>) => { if (!historyReady(items)) { toast.error(t('pp_save_error')); return; } setEditing(id); reset(v); setErrors(id ? validateExperience(v) : {}); saver.reset(); setOpen(true); };
  const onSave = async () => {
    const ok = await saver.run(
      () => { const e = validateExperience(form); setErrors(e); if (hasErrors(e)) focusFirstError(); return !hasErrors(e); },
      () => commit(editing ? items.map((x) => (x.id === editing ? { ...x, ...form } : x)) : [...items, { id: Date.now().toString(), ...form }]),
      { ok: t(editing ? 'experience_updated' : 'experience_added'), err: t('pp_save_error') },
    );
    if (ok) setOpen(false);
  };
  const upd = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto pb-28 lg:pb-6">
      <div className="max-w-2xl space-y-4">
        <SectionHeader title={t('experience')} onAdd={() => openWith(null, EMPTY_EXP)} addLabel={t('add_experience')} />
        <ExperienceDurationSummary items={items} />
        <ol className="space-y-3" aria-label={t('experience')}>
          {sorted.map((x) => {
            const incomplete = hasErrors(validateExperience(x));
            return (
              <li key={x.id}><Card className={cn(incomplete && 'border-amber-400')}><CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{x.title}</p>
                    <p className="text-sm text-muted-foreground">{x.company}{x.type && ` · ${t(EMPLOYMENT_TYPE_LABEL_KEYS[x.type])}`}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" aria-hidden="true" />{formatYearMonth(x.from, i18n.language)} – {x.current ? t('present') : formatYearMonth(x.to, i18n.language)}</p>
                    {x.country && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" />{[x.city, countryLabel(x.country, i18n.language)].filter(Boolean).join(', ')}</p>}
                  </div>
                  <RowActions label={x.title} onEdit={() => { const { id, ...rest } = x; openWith(id, rest); }} onDelete={async () => { await commit(items.filter((i) => i.id !== x.id)); toast.success(t('experience_deleted')); }} />
                </div>
                {x.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{x.description}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {x.current && <Badge className="text-xs">{t('current_position')}</Badge>}
                  {incomplete && <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 gap-1"><AlertTriangle className="w-3 h-3" aria-hidden="true" />{t('pp_incomplete_record')}</Badge>}
                </div>
              </CardContent></Card></li>
            );
          })}
        </ol>
        {items.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_experience_yet')}</p>}
      </div>

      <RecordDialog open={open} onClose={() => setOpen(false)} dirty={dirty} busy={saver.busy} title={t(editing ? 'edit_experience' : 'add_experience')}
        footer={<SaveButton busy={saver.busy} onClick={onSave} />}>
        <FormField id="ex-title" label={t('job_title')} required error={errors.title}>
          <Input {...fieldAria('ex-title', errors.title)} value={form.title} onChange={(e) => upd({ title: e.target.value })} className="h-11" placeholder={t('job_title_placeholder')} />
        </FormField>
        <FormField id="ex-company" label={t('company_name')} required error={errors.company}>
          <Input {...fieldAria('ex-company', errors.company)} value={form.company} onChange={(e) => upd({ company: e.target.value })} className="h-11" />
        </FormField>
        <FormField id="ex-type" label={t('employment_type')} required error={errors.type}>
          <Select value={form.type || undefined} onValueChange={(v) => upd({ type: v as typeof form.type })}>
            <SelectTrigger id="ex-type" className={cn('h-11', errors.type && 'border-destructive')} aria-invalid={!!errors.type || undefined}><SelectValue placeholder={t('select_type')} /></SelectTrigger>
            <SelectContent>{EMPLOYMENT_TYPES.map((c) => <SelectItem key={c} value={c}>{t(EMPLOYMENT_TYPE_LABEL_KEYS[c])}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <LocationSelector idPrefix="ex" country={form.country} city={form.city} errors={{ country: errors.country, city: errors.city }} onChange={(v) => upd(v)} />
        <DateRangeField idPrefix="ex" value={form} onChange={(v) => upd(v)} errors={{ from: errors.from, to: errors.to }} currentLabelKey="pp_current_role" />
        <FormField id="ex-desc" label={t('pp_duties_label')} required error={errors.description}
          hint={<span className="flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />{t('pp_duties_guidance')}</span>}>
          <Textarea id="ex-desc" aria-invalid={!!errors.description || undefined} aria-describedby={`ex-desc-hint ex-desc-count${errors.description ? ' ex-desc-error' : ''}`}
            value={form.description} onChange={(e) => upd({ description: e.target.value })} rows={6} className={cn(words > EXPERIENCE_DESCRIPTION_MAX_WORDS && 'border-destructive')} />
          <WordCounter id="ex-desc-count" count={words} max={EXPERIENCE_DESCRIPTION_MAX_WORDS} />
        </FormField>
      </RecordDialog>
    </div>
  );
}

// ============================================================
// Education (+ Certificates)
// ============================================================

const EMPTY_EDU: Omit<EducationRecord, 'id'> = { institution: '', degree: '', field: '', from: '', to: '', current: false };

export function EducationView() {
  const { t, i18n } = useTranslation();
  const [items, commit] = useSeekerEducation();
  const sorted = useMemo(() => sortChronological(items), [items]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { form, setForm, reset, dirty } = useFormState(EMPTY_EDU);
  const [errors, setErrors] = useState<FieldErrors<string>>({});
  const saver = useSaveRunner();

  const openWith = (id: string | null, v: Omit<EducationRecord, 'id'>) => { if (!historyReady(items)) { toast.error(t('pp_save_error')); return; } setEditing(id); reset(v); setErrors(id ? validateEducation(v) : {}); saver.reset(); setOpen(true); };
  const onSave = async () => {
    const ok = await saver.run(
      () => { const e = validateEducation(form); setErrors(e); if (hasErrors(e)) focusFirstError(); return !hasErrors(e); },
      // `grade` (GPA) is carried over untouched from the existing record, never edited.
      () => commit(editing ? items.map((x) => (x.id === editing ? { ...x, ...form, grade: x.grade } : x)) : [...items, { id: Date.now().toString(), ...form }]),
      { ok: t(editing ? 'education_updated' : 'education_added'), err: t('pp_save_error') },
    );
    if (ok) setOpen(false);
  };
  const upd = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto pb-28 lg:pb-6">
      <div className="max-w-2xl space-y-8">
        <section className="space-y-4" aria-labelledby="edu-heading">
          <div id="edu-heading"><SectionHeader title={t('education')} onAdd={() => openWith(null, EMPTY_EDU)} addLabel={t('add_education')} /></div>
          <ol className="space-y-3">
            {sorted.map((x) => {
              const incomplete = hasErrors(validateEducation(x));
              return (
                <li key={x.id}><Card className={cn(incomplete && 'border-amber-400')}><CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{x.degree ? t(DEGREE_LABEL_KEYS[x.degree]) : '—'}{x.field && ` — ${x.field}`}</p>
                      <p className="text-sm text-muted-foreground">{x.institution}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" aria-hidden="true" />{formatYearMonth(x.from, i18n.language)} – {x.current ? t('present') : formatYearMonth(x.to, i18n.language)}</p>
                    </div>
                    <RowActions label={x.institution} onEdit={() => { const { id, ...rest } = x; openWith(id, rest); }} onDelete={async () => { await commit(items.filter((i) => i.id !== x.id)); toast.success(t('education_deleted')); }} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {x.current && <Badge className="text-xs">{t('pp_current')}</Badge>}
                    {incomplete && <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 gap-1"><AlertTriangle className="w-3 h-3" aria-hidden="true" />{t('pp_incomplete_record')}</Badge>}
                  </div>
                </CardContent></Card></li>
              );
            })}
          </ol>
          {items.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_education_yet')}</p>}
        </section>

        <CertificatesSection />
      </div>

      <RecordDialog open={open} onClose={() => setOpen(false)} dirty={dirty} busy={saver.busy} title={t(editing ? 'edit_education' : 'add_education')}
        footer={<SaveButton busy={saver.busy} onClick={onSave} />}>
        <FormField id="ed-inst" label={t('institution')} required error={errors.institution}>
          <Input {...fieldAria('ed-inst', errors.institution)} value={form.institution} onChange={(e) => upd({ institution: e.target.value })} className="h-11" />
        </FormField>
        <FormField id="ed-degree" label={t('degree')} required error={errors.degree}>
          <Select value={form.degree || undefined} onValueChange={(v) => upd({ degree: v as typeof form.degree })}>
            <SelectTrigger id="ed-degree" className={cn('h-11', errors.degree && 'border-destructive')} aria-invalid={!!errors.degree || undefined}><SelectValue placeholder={t('select_degree')} /></SelectTrigger>
            <SelectContent>{DEGREES.map((d) => <SelectItem key={d} value={d}>{t(DEGREE_LABEL_KEYS[d])}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField id="ed-field" label={t('field_of_study')} required={form.degree !== 'NOT_APPLICABLE'} error={errors.field}>
          <Input {...fieldAria('ed-field', errors.field)} value={form.field} onChange={(e) => upd({ field: e.target.value })} className="h-11" />
        </FormField>
        <DateRangeField idPrefix="ed" value={form} onChange={(v) => upd(v)} errors={{ from: errors.from, to: errors.to }} currentLabelKey="pp_current_study" />
      </RecordDialog>
    </div>
  );
}

const EMPTY_CERT = { name: '', issuer: '', date: '', expiry: null as string | null, credentialId: '' };

export function CertificatesSection() {
  const { t, i18n } = useTranslation();
  const [items, commit] = useSeekerCertificates();
  const sorted = useMemo(() => sortCertificates(items), [items]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { form, setForm, reset, dirty } = useFormState(EMPTY_CERT);
  const [errors, setErrors] = useState<FieldErrors<string>>({});
  const saver = useSaveRunner();
  const noExpiry = form.expiry === null;

  const openWith = (id: string | null, v: typeof EMPTY_CERT) => { if (!historyReady(items)) { toast.error(t('pp_save_error')); return; } setEditing(id); reset(v); setErrors({}); saver.reset(); setOpen(true); };
  const onSave = async () => {
    const ok = await saver.run(
      () => { const e = validateCertificate(form); if (!noExpiry && !form.expiry) e.expiry = 'pp_err_required'; setErrors(e); if (hasErrors(e)) focusFirstError(); return !hasErrors(e); },
      () => commit(editing ? items.map((x) => (x.id === editing ? { ...x, ...form } : x)) : [...items, { id: Date.now().toString(), ...form, verified: false }]),
      { ok: t(editing ? 'certificate_updated' : 'certificate_added'), err: t('pp_save_error') },
    );
    if (ok) setOpen(false);
  };

  return (
    <section id="certificates" className="space-y-4 scroll-mt-4" aria-labelledby="cert-heading">
      <div id="cert-heading"><SectionHeader title={t('pp_certificates_section')} onAdd={() => openWith(null, EMPTY_CERT)} addLabel={t('add_certificate')} /></div>
      <ol className="space-y-3">
        {sorted.map((c) => (
          <li key={c.id}><Card><CardContent className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Award className="w-5 h-5 text-accent" aria-hidden="true" /></div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.issuer} · {formatYearMonth(c.date, i18n.language)} · {c.expiry ? `${t('pp_expires')} ${formatYearMonth(c.expiry, i18n.language)}` : t('pp_no_expiry')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {c.verified && <Badge className="text-xs gap-1"><Check className="w-3 h-3" aria-hidden="true" />{t('verified')}</Badge>}
              <RowActions label={c.name} onEdit={() => openWith(c.id, { name: c.name, issuer: c.issuer, date: c.date, expiry: c.expiry, credentialId: c.credentialId ?? '' })}
                onDelete={async () => { await commit(items.filter((i) => i.id !== c.id)); toast.success(t('certificate_deleted')); }} />
            </div>
          </CardContent></Card></li>
        ))}
      </ol>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_certificates_yet')}</p>}

      <RecordDialog open={open} onClose={() => setOpen(false)} dirty={dirty} busy={saver.busy} title={t(editing ? 'edit_certificate' : 'add_certificate')}
        footer={<SaveButton busy={saver.busy} onClick={onSave} />}>
        <FormField id="ce-name" label={t('certificate_name')} required error={errors.name}>
          <Input {...fieldAria('ce-name', errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
        </FormField>
        <FormField id="ce-issuer" label={t('issuing_organization')} required error={errors.issuer}>
          <Input {...fieldAria('ce-issuer', errors.issuer)} value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} className="h-11" />
        </FormField>
        {/* Same canonical From/To control; "Current" here means the credential does not expire. */}
        <DateRangeField idPrefix="ce" fromLabelKey="issue_date" toLabelKey="expiry_date" currentLabelKey="pp_no_expiry" futureYears={0}
          value={{ from: form.date, to: form.expiry ?? '', current: noExpiry }}
          onChange={(v) => setForm({ ...form, date: v.from, expiry: v.current ? null : v.to })}
          errors={{ from: errors.date, to: errors.expiry }} />
        <FormField id="ce-cred" label={`${t('pp_credential_id')} (${t('pp_optional')})`}>
          <Input id="ce-cred" value={form.credentialId} onChange={(e) => setForm({ ...form, credentialId: e.target.value })} className="h-11" />
        </FormField>
      </RecordDialog>
    </section>
  );
}

// ============================================================
// Languages
// ============================================================

export function LanguagesView() {
  const { t } = useTranslation();
  const [items, commit] = useSeekerLanguages();
  const sorted = useMemo(() => [...items].sort((a, b) => LANGUAGE_LEVELS.indexOf(b.level) - LANGUAGE_LEVELS.indexOf(a.level) || a.name.localeCompare(b.name)), [items]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { form, setForm, reset, dirty } = useFormState<{ name: string; level: LanguageRecord['level'] | '' }>({ name: '', level: '' });
  const [errors, setErrors] = useState<FieldErrors<'name' | 'level'>>({});
  const saver = useSaveRunner();

  const openWith = (id: string | null, v: typeof form) => { if (!historyReady(items)) { toast.error(t('pp_save_error')); return; } setEditing(id); reset(v); setErrors({}); saver.reset(); setOpen(true); };
  const onSave = async () => {
    const ok = await saver.run(
      () => {
        const e: FieldErrors<'name' | 'level'> = {};
        if (!form.name.trim()) e.name = 'pp_err_required';
        else if (items.some((l) => l.id !== editing && l.name.trim().toLowerCase() === form.name.trim().toLowerCase())) e.name = 'pp_err_duplicate';
        if (!form.level) e.level = 'pp_err_required';
        setErrors(e); if (hasErrors(e)) focusFirstError(); return !hasErrors(e);
      },
      () => {
        const rec = { name: form.name.trim(), level: form.level as LanguageRecord['level'] };
        return commit(editing ? items.map((l) => (l.id === editing ? { ...l, ...rec } : l)) : [...items, { id: Date.now().toString(), ...rec }]);
      },
      { ok: t(editing ? 'language_updated' : 'language_added'), err: t('pp_save_error') },
    );
    if (ok) setOpen(false);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto pb-28 lg:pb-6">
      <div className="max-w-2xl space-y-4">
        <SectionHeader title={t('languages')} onAdd={() => openWith(null, { name: '', level: '' })} addLabel={t('add_language')} />
        <ul className="space-y-3">
          {sorted.map((l) => (
            <li key={l.id}><Card><CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3"><LanguagesIcon className="w-5 h-5 text-primary" aria-hidden="true" /><p className="font-medium">{l.name}</p></div>
              <div className="flex items-center gap-1"><Badge variant="secondary" className="text-xs">{t(LANGUAGE_LEVEL_LABEL_KEYS[l.level])}</Badge>
                <RowActions label={l.name} onEdit={() => openWith(l.id, { name: l.name, level: l.level })} onDelete={async () => { await commit(items.filter((i) => i.id !== l.id)); toast.success(t('language_deleted')); }} />
              </div>
            </CardContent></Card></li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_languages_yet')}</p>}
      </div>
      <RecordDialog open={open} onClose={() => setOpen(false)} dirty={dirty} busy={saver.busy} title={t(editing ? 'edit_language' : 'add_language')}
        footer={<SaveButton busy={saver.busy} onClick={onSave} />}>
        <FormField id="la-name" label={t('language_name')} required error={errors.name}>
          <Input {...fieldAria('la-name', errors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11" />
        </FormField>
        <FormField id="la-level" label={t('proficiency_level')} required error={errors.level}>
          <Select value={form.level || undefined} onValueChange={(v) => setForm({ ...form, level: v as LanguageRecord['level'] })}>
            <SelectTrigger id="la-level" className={cn('h-11', errors.level && 'border-destructive')}><SelectValue placeholder={t('proficiency_level')} /></SelectTrigger>
            <SelectContent>{LANGUAGE_LEVELS.map((lv) => <SelectItem key={lv} value={lv}>{t(LANGUAGE_LEVEL_LABEL_KEYS[lv])}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
      </RecordDialog>
    </div>
  );
}
