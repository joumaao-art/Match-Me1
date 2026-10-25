import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { FormField, LocationSelector, SearchableCombobox, useCountries } from '@/components/shared/ProfileFields';
import { DateWheels } from '@/components/onboarding/MobileControls';
import { ageFromBirthday } from '@/lib/mobile-date-wheel';
import { isValidE164 } from '@/lib/phone';
import { useAuthStore } from '@/stores';
import { loadAccount, type AccountSnapshot } from '@/services/mobile-account';
import { CURRENCY_CODES, PERSONAL_TITLES, currencyPrecision, personalInformationDraft, personalInformationErrors, personalInformationPatch, savePersonalInformation, type PersonalInformationDraft } from '@/services/personal-information';

export function PersonalInformationForm({ account, mobile, onSaved }: { account: AccountSnapshot; mobile: boolean; onSaved: (account: AccountSnapshot) => void }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const lang = ar ? 'ar' : 'en';
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const [base, setBase] = useState(account);
  const [draft, setDraft] = useState(() => personalInformationDraft(account.profile));
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const currencyOptions = useMemo(() => {
    const names = new Intl.DisplayNames([lang], { type: 'currency' });
    return CURRENCY_CODES.map(code => ({ value: code, label: `${code} — ${names.of(code) ?? code}` }));
  }, [lang]);
  const set = (key: keyof PersonalInformationDraft, value: string) => {
    setDraft(current => ({ ...current, [key]: value })); setNotice('');
    setErrors(current => { const next = { ...current }; delete next[key]; return next; });
  };
  const errorText = (key: string) => errors[key] ? ({
    name: copy('Enter a legal name, up to 100 characters, using letters and normal name punctuation.', 'أدخل اسماً قانونياً حتى 100 حرف باستخدام الحروف وعلامات الأسماء المعتادة.'),
    title: copy('Select a valid title.', 'اختر لقباً صالحاً.'),
    required: copy('This field is required.', 'هذا الحقل مطلوب.'),
    birthday: copy('Select a valid birthday within the last 100 years, not in the future.', 'اختر تاريخ ميلاد صالحاً خلال آخر 100 سنة وليس في المستقبل.'),
    phone: copy('Enter a valid international mobile number.', 'أدخل رقم جوال دولياً صالحاً.'),
    currency: copy('Select a supported currency.', 'اختر عملة مدعومة.'),
    frequency: copy('Select Monthly or Annually.', 'اختر شهرياً أو سنوياً.'),
    amount: copy(`Enter a positive amount with up to ${currencyPrecision(draft.compensationCurrency)} decimal places.`, `أدخل مبلغاً موجباً حتى ${currencyPrecision(draft.compensationCurrency)} منازل عشرية.`),
  } as Record<string,string>)[errors[key]] : undefined;
  const aria = (key: string) => ({ 'aria-invalid': !!errors[key] || undefined, 'aria-describedby': errors[key] ? `personal-${key}-error` : undefined });
  const field = (key: 'first_name' | 'last_name', label: string) => <FormField id={`personal-${key}`} label={label} required error={errorText(key)}><Input id={`personal-${key}`} value={draft[key]} onChange={event => set(key,event.target.value)} className="h-11" maxLength={100} autoComplete={key === 'first_name' ? 'given-name' : 'family-name'} {...aria(key)}/></FormField>;
  const save = async () => {
    if (lock.current) return;
    const validation = personalInformationErrors(draft,base.email);
    if (countries.length && draft.phone && !isValidE164(draft.phone,countries)) validation.phone = 'phone';
    setErrors(validation); setError(''); setNotice('');
    if (Object.keys(validation).length) return;
    if (countriesLoading || countriesError) { setError(copy('Country validation is unavailable. Please retry when it loads.', 'التحقق من البلدان غير متاح. أعد المحاولة بعد تحميله.')); return; }
    if (!Object.keys(personalInformationPatch(base.profile,draft)).length) { setNotice(copy('No changes to save.', 'لا توجد تغييرات للحفظ.')); return; }
    lock.current = true; setBusy(true);
    try {
      const saved = await savePersonalInformation(base,draft);
      if (!alive.current || useAuthStore.getState().userId !== base.uid) return;
      setBase(saved); setDraft(personalInformationDraft(saved.profile)); onSaved(saved);
      setNotice(copy('Personal information saved.', 'تم حفظ المعلومات الشخصية.'));
      window.dispatchEvent(new Event('matchme:profile-changed'));
    } catch {
      if (alive.current) setError(copy('Save failed or your account information changed elsewhere. Your edits are retained. Go back and reload to resolve conflicts.', 'تعذر الحفظ أو تغيّرت بيانات الحساب في مكان آخر. تم الاحتفاظ بتعديلاتك. ارجع وأعد التحميل لحل التعارض.'));
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const age = ageFromBirthday(draft.date_of_birth);
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return <form dir={ar ? 'rtl' : 'ltr'} className="space-y-7" noValidate onSubmit={event => { event.preventDefault(); void save(); }} data-testid="personal-information-form">
    <fieldset disabled={busy} className="space-y-7">
      <fieldset className="space-y-4" data-personal-category="identity"><legend className="text-base font-semibold mb-4">{copy('Identity','الهوية')}</legend>
        <FormField id="personal-title" label={copy('Title','اللقب')} error={errorText('title')}><select id="personal-title" className="h-11 w-full border rounded-md bg-background px-3 text-sm" value={draft.title} onChange={event => set('title',event.target.value)} {...aria('title')}><option value="">{copy('Select title','اختر اللقب')}</option>{PERSONAL_TITLES.map(title => <option key={title} value={title}>{title}</option>)}</select></FormField>
        <div className={mobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>{field('first_name',copy('Legal First Name','الاسم الأول القانوني'))}{field('last_name',copy('Legal Last Name','اسم العائلة القانوني'))}</div>
        <FormField id="personal-date_of_birth" label={copy('Birthday','تاريخ الميلاد')} required error={errorText('date_of_birth')}>
          {mobile ? <DateWheels label={copy('Birthday','تاريخ الميلاد')} value={draft.date_of_birth} lang={lang} onChange={value => set('date_of_birth',value)}/> : <Input id="personal-date_of_birth" type="date" value={draft.date_of_birth} max={maxDate} onChange={event => set('date_of_birth',event.target.value)} className="h-11" {...aria('date_of_birth')}/>}
          {mobile && <p className="text-xs text-muted-foreground mt-2" dir="auto">{draft.date_of_birth || copy('Choose your birthday using the wheels.','اختر تاريخ الميلاد باستخدام القوائم المتحركة.')}</p>}
          <p aria-live="polite" className="text-xs text-muted-foreground mt-2">{age !== null ? copy(`You are ${age} years old`, `عمرك ${age} سنة`) : ''}</p>
        </FormField>
      </fieldset>
      <fieldset className="space-y-4" data-personal-category="contact"><legend className="text-base font-semibold mb-4">{copy('Contact','التواصل')}</legend>
        <FormField id="personal-email" label={copy('Email','البريد الإلكتروني')} required error={errorText('email')}><Input id="personal-email" value={base.email} readOnly dir="ltr" className="h-11"/><p className="text-xs text-muted-foreground mt-2">{copy('Registered email is read-only. Changing it requires account verification.','البريد المسجل للقراءة فقط. يتطلب تغييره التحقق من الحساب.')}</p></FormField>
        <fieldset disabled={!!base.authPhone}><FormField id="personal-phone" label={copy('Mobile','الجوال')} required error={errorText('phone')}><PhoneInput id="personal-phone" value={draft.phone} onChange={value => set('phone',value)} invalid={!!errors.phone}/>{base.authPhone && <p className="text-xs text-muted-foreground mt-2">{copy('Verified login phone. A secure phone-change flow is not configured here.','رقم تسجيل دخول موثق. تغيير الرقم الآمن غير مُعدّ هنا.')}</p>}</FormField></fieldset>
        <div className="space-y-3"><p className="text-sm font-medium">{copy('Address','العنوان')}</p><LocationSelector idPrefix="personal" country={draft.country} city={draft.city} errors={{ country: errorText('country'), city: errorText('city') }} onChange={value => { set('country',value.country); set('city',value.city); }}/>
          <FormField id="personal-location" label={copy('Address details','تفاصيل العنوان')}><Input id="personal-location" value={draft.location} onChange={event => set('location',event.target.value)} className="h-11" autoComplete="street-address"/><p className="text-xs text-muted-foreground mt-2">{copy('Existing address details are preserved unless you edit them.','تُحفظ تفاصيل العنوان الحالية ما لم تعدّلها.')}</p></FormField>
        </div>
      </fieldset>
      <fieldset className="space-y-4" data-personal-category="compensation"><legend className="text-base font-semibold mb-4">{copy('Compensation','التعويضات')}</legend>
        <div><p className="text-sm font-medium">{copy('Current Compensation (optional)','التعويض الحالي (اختياري)')}</p><p className="text-xs text-muted-foreground mt-2">{copy('Private to your account. Not included in VIA Resume, profile completion or job matching. Leave all fields blank if you prefer.','خاص بحسابك. لا يُضاف إلى سيرة VIA أو اكتمال الملف أو مطابقة الوظائف. يمكنك ترك جميع الحقول فارغة.')}</p></div>
        <FormField id="personal-compensationCurrency" label={copy('Currency','العملة')} error={errorText('compensationCurrency')}><SearchableCombobox id="personal-compensationCurrency" options={currencyOptions} value={draft.compensationCurrency ? [draft.compensationCurrency] : []} onChange={value => set('compensationCurrency',value[0] ?? '')} placeholder={copy('Select currency','اختر العملة')} disabled={busy} invalid={!!errors.compensationCurrency}/></FormField>
        <div className={mobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}><FormField id="personal-compensationAmount" label={copy('Amount','المبلغ') + (draft.compensationCurrency ? ` (${draft.compensationCurrency})` : '')} error={errorText('compensationAmount')}><Input id="personal-compensationAmount" type="number" inputMode="decimal" min="0" step={10 ** -currencyPrecision(draft.compensationCurrency)} value={draft.compensationAmount} onChange={event => set('compensationAmount',event.target.value)} className="h-11" dir="ltr" {...aria('compensationAmount')}/></FormField>
          <FormField id="personal-compensationFrequency" label={copy('Payment Frequency','فترة الدفع')} error={errorText('compensationFrequency')}><select id="personal-compensationFrequency" className="h-11 w-full border rounded-md bg-background px-3 text-sm" value={draft.compensationFrequency} onChange={event => set('compensationFrequency',event.target.value)} {...aria('compensationFrequency')}><option value="">{copy('Select frequency','اختر فترة الدفع')}</option><option value="monthly">{copy('Monthly','شهرياً')}</option><option value="annually">{copy('Annually','سنوياً')}</option></select></FormField></div>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => { setDraft(value => ({ ...value, compensationAmount: '', compensationCurrency: '', compensationFrequency: '' })); setErrors(value => Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('compensation')))); setNotice(''); }}>{copy('Clear compensation','مسح التعويض')}</Button>
      </fieldset>
      <fieldset className="space-y-4" data-personal-category="gender"><legend className="text-base font-semibold mb-4">{copy('Gender','الجنس')}</legend><FormField id="personal-gender" label={copy('Gender','الجنس')} required error={errorText('gender')}><select id="personal-gender" className="h-11 w-full border rounded-md bg-background px-3 text-sm" value={draft.gender} onChange={event => set('gender',event.target.value)} {...aria('gender')}><option value="">{copy('Select gender','اختر الجنس')}</option><option value="male">{copy('Male','ذكر')}</option><option value="female">{copy('Female','أنثى')}</option><option value="prefer_not_to_say">{copy('Prefer not to say','أفضل عدم الإفصاح')}</option></select></FormField></fieldset>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-primary">{notice}</p>}
    <div className={mobile ? 'sticky bottom-0 py-3 bg-background' : 'pt-2'}><Button type="submit" disabled={busy} aria-busy={busy} className={mobile ? 'w-full h-12' : 'min-h-11'}>{busy ? copy('Saving…','جارٍ الحفظ…') : copy('Save','حفظ')}</Button></div>
  </form>;
}

export function PersonalInformationPage() {
  const uid = useAuthStore(state => state.userId);
  return <DesktopPersonalContent key={uid ?? 'guest'} uid={uid}/>;
}
function DesktopPersonalContent({ uid }: { uid: string | null }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const [account,setAccount] = useState<AccountSnapshot | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  const alive = useRef(true);
  const load = async () => {
    setLoading(true); setError(false);
    try {
      if (!uid) throw new Error('Authentication required');
      const value = await loadAccount(uid);
      if (alive.current && useAuthStore.getState().userId === uid) setAccount(value);
    } catch { if (alive.current) setError(true); }
    finally { if (alive.current) setLoading(false); }
  };
  useEffect(() => { alive.current=true; void load(); return () => { alive.current=false; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <section dir={ar ? 'rtl' : 'ltr'} className="flex-1 p-4 sm:p-6 overflow-y-auto pb-28 lg:pb-6"><div className="max-w-2xl space-y-6"><Button type="button" variant="ghost" className="min-h-11" onClick={() => navigate('/seeker?view=profile')}>{ar ? 'العودة إلى الملف الشخصي' : 'Back to Profile'}</Button><h1 className="text-xl font-bold font-[Poppins]">{ar ? 'المعلومات الشخصية' : 'Personal Information'}</h1>{loading ? <p role="status">{ar ? 'جارٍ تحميل الحساب…' : 'Loading account…'}</p> : error ? <div role="alert"><p className="text-sm text-destructive mb-3">{ar ? 'تعذر تحميل الحساب. أعد المحاولة.' : 'Unable to load your account. Please retry.'}</p><Button onClick={() => void load()}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button></div> : account && <div className="rounded-xl border bg-card p-4 sm:p-6"><PersonalInformationForm account={account} mobile={false} onSaved={setAccount}/></div>}</div></section>;
}
