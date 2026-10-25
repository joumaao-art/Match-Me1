import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountryMultiSelector } from '@/components/shared/ProfileFields';
import { MOBILE_WORK_TYPES, WORKING_STYLES, SENIORITY } from '@/lib/mobile-onboarding-options';
import { EMPTY_PREFERENCES, expertiseLabel, searchExpertise, type JobPreferences } from '@/lib/job-preferences';
import { canAddPreference, normalizeKeyword, PREFERENCE_KEYWORDS, preferenceSelectionCount, visiblePreferencePatch, PreferenceConflict } from '@/lib/mobile-preferences';
import { preferencesService, type PreferenceSnapshot } from '@/services/preferences.service';
import { useAuthStore } from '@/stores';
import { safeViaReturn } from '@/lib/via-premium';
import { toast } from 'sonner';

export function MobileSwipePreferences() {
 const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const copy = (en: string, arabic: string) => ar ? arabic : en;
 const uid = useAuthStore(s => s.userId); const route = useLocation(); const navigate = useNavigate();
 const back = safeViaReturn(new URLSearchParams(route.search).get('return'));
 const [base, setBase] = useState<PreferenceSnapshot | null>(null);
 const [draft, setDraft] = useState<JobPreferences>({ ...EMPTY_PREFERENCES });
 const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [conflict, setConflict] = useState(false);
 const [query, setQuery] = useState(''); const [open, setOpen] = useState(false); const [active, setActive] = useState(0); const [limitNotice, setLimitNotice] = useState(false);
 const lock = useRef(false); const mounted = useRef(false); const dirtyRef = useRef(false); const root = useRef<HTMLDivElement>(null);
 const dirty = !!base && Object.keys(visiblePreferencePatch(base.prefs, draft)).length > 0; dirtyRef.current = dirty;
 const owned = () => mounted.current && useAuthStore.getState().userId === uid;
 const load = async () => {
  setLoading(true); setError('');
  try { const snapshot = await preferencesService.load(uid || ''); if (owned()) { setBase(snapshot); setDraft(snapshot.prefs); setConflict(false); } }
  catch { if (owned()) setError(copy('Unable to load saved preferences. Check the connection and retry.', 'تعذر تحميل التفضيلات. تحقق من الاتصال وأعد المحاولة.')); }
  finally { if (owned()) setLoading(false); }
 };
 useEffect(() => { mounted.current = true; setBase(null); setDraft({ ...EMPTY_PREFERENCES }); void load(); return () => { mounted.current = false; }; }, [uid]);
 useEffect(() => {
  const warn = (event: BeforeUnloadEvent) => { if (dirtyRef.current || lock.current) { event.preventDefault(); event.returnValue = ''; } };
  const leave = (event: Event) => {
   if (lock.current) { event.preventDefault(); return; }
   if (dirtyRef.current && !window.confirm(copy('Changes have not been saved. Discard changes and leave? Choose Cancel to continue editing.', 'لم تُحفظ التغييرات. تجاهلها والمغادرة؟ اختر إلغاء لمتابعة التعديل.'))) event.preventDefault();
  };
  // React Router's existing browser history remains the navigation owner.
  const pop = (event: PopStateEvent) => {
   if (!dirtyRef.current && !lock.current) return;
   if (lock.current || !window.confirm(copy('Discard unsaved preferences? Cancel to continue editing.', 'تجاهل التفضيلات غير المحفوظة؟ إلغاء لمتابعة التعديل.'))) {
    event.stopImmediatePropagation();
    window.history.pushState(window.history.state, '', `${route.pathname}${route.search}`);
   }
  };
  window.addEventListener('beforeunload', warn); window.addEventListener('matchme:before-preferences-leave', leave); window.addEventListener('popstate', pop, true);
  return () => { window.removeEventListener('beforeunload', warn); window.removeEventListener('matchme:before-preferences-leave', leave); window.removeEventListener('popstate', pop, true); };
 }, [ar, navigate, route.pathname, route.search]);
 useEffect(() => { const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, []);
 const count = preferenceSelectionCount(draft);
 const results = useMemo(() => {
  const roles = searchExpertise(query, i18n.language).map(r => ({ kind: 'role' as const, value: r.code, label: ar ? r.ar : r.en }));
  const keywords = PREFERENCE_KEYWORDS.filter(k => k.includes(normalizeKeyword(query))).map(k => ({ kind: 'keyword' as const, value: k, label: k }));
  return [...roles, ...keywords].filter(item => !draft[item.kind === 'role' ? 'expertise' : 'keywords'].some(v => normalizeKeyword(v) === normalizeKeyword(item.value))).slice(0, 30);
 }, [query, i18n.language, ar, draft.expertise, draft.keywords]);
 const add = (kind: 'role' | 'keyword', value: string) => {
  if (!canAddPreference(draft, kind, value)) { setLimitNotice(true); return; }
  const field = kind === 'role' ? 'expertise' : 'keywords';
  setDraft(p => ({ ...p, [field]: [...p[field], kind === 'keyword' ? normalizeKeyword(value) : value] })); setQuery(''); setActive(0); setLimitNotice(false);
 };
 const legacyLevels = draft.seniorityLevels.filter(code => !['junior', 'mid', 'senior'].includes(code));
 const save = async () => {
  if (!base || !uid || lock.current) return;
  if (count > 10) { setLimitNotice(true); setError(copy('Remove selections until there are at most 10 roles and keywords combined.', 'أزل بعض الاختيارات حتى يصبح مجموع الأدوار والكلمات 10 أو أقل.')); return; }
  lock.current = true; setBusy(true); setError('');
  try {
   const snapshot = await preferencesService.save(uid, base, visiblePreferencePatch(base.prefs, draft));
   if (!owned()) return;
   setBase(snapshot); setDraft(snapshot.prefs); dirtyRef.current = false;
   toast.success(copy('Preferences saved', 'تم حفظ التفضيلات')); navigate(back, { replace: true });
  } catch (e) {
   if (!owned()) return;
   setConflict(e instanceof PreferenceConflict);
   setError(e instanceof PreferenceConflict ? copy('Preferences changed elsewhere. Your edits are retained. Review the latest saved values before retrying.', 'تم تغيير التفضيلات في مكان آخر. بقيت تعديلاتك. راجع القيم المحفوظة قبل إعادة المحاولة.') : copy('Could not save. Your edits are retained. Check your connection and retry using the checkmark.', 'تعذر الحفظ. بقيت تعديلاتك. تحقق من الاتصال وأعد المحاولة بعلامة الصح.'));
  } finally { lock.current = false; if (owned()) setBusy(false); }
 };
 const reviewLatest = async () => {
  if (!base || !uid || busy) return;
  try {
   const latest = await preferencesService.load(uid); if (!owned()) return;
   const patch = visiblePreferencePatch(base.prefs, draft);
   const changed = Object.keys(patch).filter(field => JSON.stringify(base.raw[field] ?? []) !== JSON.stringify(latest.raw[field] ?? []));
   const summary = changed.map(field => `${field}: ${JSON.stringify(latest.raw[field] ?? [])}`).join('\n');
   if (window.confirm(copy(`Latest saved values:\n${summary}\nKeep your edits for these fields and retry with the checkmark? Cancel to keep reviewing.`, `القيم المحفوظة الآن:\n${summary}\nالاحتفاظ بتعديلاتك لهذه الحقول؟ إلغاء لمتابعة المراجعة.`))) { setBase(latest); setDraft(p => ({ ...latest.prefs, ...visiblePreferencePatch(base.prefs, p) })); setConflict(false); setError(''); }
  } catch { setError(copy('Unable to load latest preferences. Retry when connected.', 'تعذر تحميل أحدث التفضيلات. أعد المحاولة عند الاتصال.')); }
 };
 const leave = () => { const event = new Event('matchme:before-preferences-leave', { cancelable: true }); if (window.dispatchEvent(event)) navigate(back); };
 return <section className="flex-1 min-h-0 flex flex-col" dir={ar ? 'rtl' : 'ltr'}>
  <header className="shrink-0 border-b bg-background px-4 py-2 flex items-center justify-between" dir="ltr" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
   <button type="button" className="flex items-center gap-2 min-h-11" onClick={leave} aria-label={copy('Back to Swipe', 'العودة إلى التصفح')}><span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Sparkles size={20}/></span><span className="font-semibold text-sm">MatchMe</span></button>
   <Button size="icon" variant="ghost" className="h-11 w-11 text-green-700 dark:text-green-400" aria-label={copy('Save Preferences', 'حفظ التفضيلات')} disabled={loading || busy || !base} onClick={() => void save()}>{busy ? <Loader2 size={22} className="animate-spin"/> : <Check size={26}/>}</Button>
  </header>
  <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 w-full max-w-md mx-auto">
   {loading && <p role="status" className="text-sm">{copy('Loading saved preferences…', 'جارٍ تحميل التفضيلات…')}</p>}
   {error && <div role="alert" className="text-sm text-destructive space-y-2"><p>{error}</p>{!base && <Button variant="outline" className="!bg-transparent" onClick={() => void load()}>{copy('Retry loading', 'إعادة التحميل')}</Button>}{conflict && <Button variant="outline" className="!bg-transparent" onClick={() => void reviewLatest()}>{copy('Review latest preferences', 'مراجعة أحدث التفضيلات')}</Button>}</div>}
   <fieldset disabled={loading || busy || !base} className="space-y-5">
    <section ref={root} className="space-y-2"><label htmlFor="swipe-role-keyword" className="text-sm font-semibold">{copy('Roles & Keywords', 'الأدوار والكلمات المفتاحية')}</label>
     <div className="flex flex-wrap gap-1.5">{[...draft.expertise.map(value => ({ field: 'expertise' as const, value, label: expertiseLabel(value, i18n.language) })), ...draft.keywords.map(value => ({ field: 'keywords' as const, value, label: value }))].map(item => <span key={`${item.field}:${item.value}`} className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs ps-3 max-w-full"><span className="break-words">{item.label}</span><button type="button" aria-label={`${copy('Remove', 'إزالة')} ${item.label}`} className="min-h-9 min-w-9 grid place-items-center" onClick={() => { setDraft(p => ({ ...p, [item.field]: p[item.field].filter(v => v !== item.value) })); setLimitNotice(false); }}><X size={14}/></button></span>)}</div>
     <Input id="swipe-role-keyword" role="combobox" aria-expanded={open} aria-controls="swipe-role-results" aria-autocomplete="list" aria-activedescendant={open && results[active] ? `swipe-result-${active}` : undefined} className="h-11" value={query} placeholder={copy('Search roles or keywords', 'ابحث عن دور أو كلمة')} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'ArrowDown') { e.preventDefault(); setActive(v => Math.min(v + 1, results.length - 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setActive(v => Math.max(0, v - 1)); } if (e.key === 'Enter') { e.preventDefault(); const r = results[active]; if (r) add(r.kind, r.value); } }}/>
     <p className="text-xs text-muted-foreground">{copy(`${count}/10 selected`, `${count}/10 محددة`)}</p>
     {(count >= 10 || limitNotice) && <p role="status" className="text-xs text-muted-foreground">{copy('Maximum 10 roles and keywords combined. Remove a selection to add another. Duplicate selections are not allowed.', 'الحد الأقصى 10 أدوار وكلمات معاً. أزل اختياراً لإضافة آخر. لا يمكن التكرار.')}</p>}
     {open && <div id="swipe-role-results" role="listbox" aria-multiselectable="true" className="max-h-44 overflow-y-auto overscroll-contain border rounded-lg">{results.map((item, index) => <button key={`${item.kind}:${item.value}`} id={`swipe-result-${index}`} type="button" role="option" aria-selected={false} aria-disabled={!canAddPreference(draft, item.kind, item.value)} className={`w-full min-h-11 px-3 py-2 flex items-center justify-between gap-2 text-start text-sm ${index === active ? 'bg-muted' : ''}`} onPointerDown={e => e.preventDefault()} onClick={() => add(item.kind, item.value)}><span>{item.label}</span><span className="text-xs text-muted-foreground">{item.kind === 'role' ? copy('Role', 'دور') : copy('Keyword', 'كلمة')}</span></button>)}{!results.length && <p className="p-3 text-sm text-muted-foreground">{copy('No results', 'لا توجد نتائج')}</p>}</div>}
    </section>
    <section className="space-y-2"><label htmlFor="swipe-pref-country" className="text-sm font-semibold">{copy('Where I am interested in the job search', 'الدول التي أهتم بالبحث عن عمل فيها')}</label><CountryMultiSelector id="swipe-pref-country" value={draft.targetCountries} onChange={targetCountries => setDraft(p => ({ ...p, targetCountries }))}/></section>
    {[{ title: copy('Job Type', 'نوع الوظيفة'), field: 'employmentTypes' as const, options: MOBILE_WORK_TYPES }, { title: copy('Work Style', 'أسلوب العمل'), field: 'workingStyles' as const, options: WORKING_STYLES }, { title: copy('Level', 'المستوى'), field: 'seniorityLevels' as const, options: SENIORITY.filter(o => ['junior', 'mid', 'senior'].includes(o.code)) }].map(group => <fieldset key={group.field} className="space-y-2"><legend className="text-sm font-semibold mb-2">{group.title}</legend><div className="flex flex-wrap gap-2">{group.options.map(option => <button key={option.code} type="button" role="checkbox" aria-checked={(draft[group.field] as string[]).includes(option.code)} className={`min-h-11 rounded-lg px-3 border text-sm ${(draft[group.field] as string[]).includes(option.code) ? 'bg-primary/10 border-primary text-primary' : 'border-input'}`} onClick={() => setDraft(p => ({ ...p, [group.field]: (p[group.field] as string[]).includes(option.code) ? p[group.field].filter(v => v !== option.code) : [...p[group.field], option.code] }))}>{ar ? option.ar : option.en}</button>)}</div>{group.field === 'seniorityLevels' && legacyLevels.length > 0 && <p className="text-xs text-muted-foreground">{copy('Previous levels outside this simplified view are retained; these selections will not be removed when you save.', 'المستويات السابقة خارج هذا العرض محفوظة ولن تُحذف عند الحفظ.')}</p>}</fieldset>)}
   </fieldset>
  </div>
 </section>;
}
