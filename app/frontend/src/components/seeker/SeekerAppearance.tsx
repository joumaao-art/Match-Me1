import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { refreshSeekerTheme, saveSeekerTheme, useSeekerAppearance, type SeekerTheme } from '@/lib/seeker-appearance';

const themes = [
  { value: 'light', en: 'Light Mode', ar: 'الوضع الفاتح', Icon: Sun },
  { value: 'dark', en: 'Dark Mode', ar: 'الوضع الداكن', Icon: Moon },
  { value: 'system', en: 'System Default', ar: 'إعداد النظام', Icon: Monitor },
] as const;
export function SeekerAppearance({ uid }: { uid: string }) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const state = useSeekerAppearance();
  const available = state.owner === uid;
  const choose = (theme: SeekerTheme) => { void saveSeekerTheme(uid, theme); };
  return <section aria-labelledby="appearance-title" className="space-y-3" dir={ar ? 'rtl' : 'ltr'}>
    <h2 id="appearance-title" className="text-base font-semibold">{ar ? 'المظهر' : 'Appearance'}</h2>
    <p id="appearance-theme-label" className="text-sm font-medium">{ar ? 'السمة' : 'Theme'}</p>
    <div role="radiogroup" aria-labelledby="appearance-theme-label" className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
      {themes.map(({ value, en, ar: arabic, Icon }) => <button key={value} type="button" role="radio" aria-checked={available && state.theme === value} disabled={!available || state.loading || state.saving} onClick={() => choose(value)} className={`min-h-11 flex items-center justify-center gap-2 rounded-lg border px-2 py-3 text-sm disabled:opacity-60 ${available && state.theme === value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-input bg-background text-foreground hover:bg-muted'}`}><Icon size={18} className="shrink-0"/><span>{ar ? arabic : en}</span></button>)}
    </div>
    <p role="status" className={`text-xs ${state.error ? 'text-destructive' : 'text-muted-foreground'}`}>
      {!available || state.loading ? ar ? 'جارٍ تحميل المظهر…' : 'Loading appearance…' : state.saving ? ar ? 'تم تطبيق السمة. جارٍ حفظ التفضيل…' : 'Theme applied. Saving preference…' : state.error ? ar ? 'تعذر حفظ أو تحديث التفضيل. أعد التحميل والمحاولة.' : 'Preference could not be saved or refreshed. Reload and retry.' : state.saved ? ar ? 'تم حفظ تفضيل السمة.' : 'Theme preference saved.' : ar ? 'يستخدم الجوال وسطح المكتب تفضيل الحساب نفسه.' : 'Mobile and desktop use the same account preference.'}
    </p>
    {state.error && <Button type="button" variant="ghost" className="min-h-11" onClick={() => void refreshSeekerTheme(uid)}>{ar ? 'إعادة التحميل' : 'Reload preference'}</Button>}
  </section>;
}
