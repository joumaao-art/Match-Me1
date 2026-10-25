import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DateWheels } from '@/components/onboarding/MobileControls';
import { dateWheelParts, dateWheelValue } from '@/lib/mobile-date-wheel';
import { confirmationDateLabel, validConfirmationDate } from '@/lib/mobile-date-confirmation';

type Props = {
  label: string; value: string; onChange: (value: string) => void;
  renderPicker: (value: string, onChange: (value: string) => void) => ReactNode;
  monthOnly?: boolean; optional?: boolean; initialDraft?: () => string; validate?: (value: string) => string | undefined;
};

export function MobileConfirmedDate({ label, value, onChange, renderPicker, monthOnly = false, optional = false, initialDraft, validate }: Props) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const [editing, setEditing] = useState(!value && !optional);
  const [draft, setDraft] = useState(() => value || initialDraft?.() || '');
  const [error, setError] = useState('');
  const confirmationGeneration = useRef(0);
  const previous = useRef(value);
  const id = useId();
  const editButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    confirmationGeneration.current++;
    setDraft(value || initialDraft?.() || '');
    setEditing(!value && !optional); setError('');
  }, [value, initialDraft, optional]);
  const latestDraft = useRef(draft); latestDraft.current = draft;
  const confirming = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current=true; return()=>{alive.current=false;}; },[]);
  const confirm = async () => {
    if(confirming.current)return;
    confirming.current=true;
    const generation=++confirmationGeneration.current;
    await new Promise(resolve=>setTimeout(resolve,220));
    confirming.current=false;
    if(!alive.current||generation!==confirmationGeneration.current)return;
    const selected=latestDraft.current;
    const issue = !validConfirmationDate(selected, monthOnly, monthOnly) ? copy('Select a valid date.', 'اختر تاريخاً صالحاً.') : validate?.(selected);
    if (issue) { setError(t(issue)); return; }
    onChange(selected); setEditing(false); setError('');
    requestAnimationFrame(() => editButton.current?.focus());
  };
  return <div data-date-editing={editing ? 'true' : undefined} data-date-confirmation={label} className="space-y-2" dir={ar ? 'rtl' : 'ltr'}>
    {editing && <div id={id} className="space-y-2">
      {renderPicker(draft, next => { setDraft(next); setError(''); })}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        <Button type="button" className="min-h-11" onClick={confirm}>{copy('Confirm Date', 'تأكيد التاريخ')}</Button>
        {(value || optional) && <Button type="button" variant="ghost" className="min-h-11" onClick={() => { confirmationGeneration.current++; setDraft(value); setEditing(false); setError(''); requestAnimationFrame(() => editButton.current?.focus()); }}>{copy('Cancel', 'إلغاء')}</Button>}
      </div>
    </div>}
    {!value && !editing && <Button type="button" variant="ghost" className="min-h-11 text-primary" onClick={() => { setDraft(initialDraft?.() || ''); setEditing(true); }}>{copy('Select Date', 'اختر التاريخ')}</Button>}
    {value && <div className="flex items-center justify-between gap-3 text-sm min-h-11" aria-live="polite">
      <span className="text-muted-foreground">{confirmationDateLabel(value, ar ? 'ar' : 'en', monthOnly)}</span>
      {!editing && <Button ref={editButton} type="button" variant="ghost" className="min-h-11 text-primary shrink-0" aria-label={`${copy('Edit', 'تعديل')} ${label}`} aria-controls={id} aria-expanded={editing} onClick={() => { setDraft(value); setEditing(true); setError(''); }}>{copy('Edit', 'تعديل')}</Button>}
    </div>}
  </div>;
}

export function ConfirmedDateWheels({ label, value, onChange, monthOnly = false, future = false, optional = false, lang = 'en', validate }: {
  label: string; value: string; onChange: (v: string) => void; monthOnly?: boolean; future?: boolean; optional?: boolean; lang?: string; validate?: (value: string) => string | undefined;
}) {
  const initialDraft = () => { const now = new Date(); const { year, month, day } = dateWheelParts('', now); return dateWheelValue(year, month, day, monthOnly, future, now); };
  return <MobileConfirmedDate label={label} value={value} onChange={onChange} monthOnly={monthOnly} optional={optional} initialDraft={initialDraft} validate={validate}
    renderPicker={(draft, change) => <DateWheels label={label} value={draft} onChange={change} monthOnly={monthOnly} future={future} lang={lang}/>}/>;
}
