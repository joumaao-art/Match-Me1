import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCountries } from '@/components/shared/ProfileFields';
import { DEFAULT_PHONE_COUNTRY, flagEmoji, parsePhone, sanitizeNational, toE164 } from '@/lib/phone';

interface PhoneInputProps {
  id: string;
  /** Normalized E.164 value (legacy formatted values are parsed for editing). */
  value: string;
  onChange: (e164: string) => void;
  invalid?: boolean;
  describedBy?: string;
  defaultCountry?: string;
}

/**
 * International phone field: searchable calling-code picker plus a national
 * number input. The number is always laid out LTR (digits read left-to-right
 * in Arabic too) while the surrounding layout follows the document direction.
 */
export function PhoneInput({ id, value, onChange, invalid, describedBy, defaultCountry = DEFAULT_PHONE_COUNTRY }: PhoneInputProps) {
  const { t } = useTranslation();
  const { countries } = useCountries();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [countryOverride, setCountryOverride] = useState<string | null>(null);

  const parts = useMemo(() => parsePhone(value, countries, countryOverride ?? defaultCountry), [value, countries, countryOverride, defaultCountry]);
  const country = countries.find((c) => c.code === (countryOverride && !value ? countryOverride : parts?.country)) ?? countries.find((c) => c.code === defaultCountry);
  const dial = country?.dial ?? '';
  const national = parts?.national ?? value.replace(/\D/g, '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    return q ? countries.filter((c) => c.dial && (c.en.toLowerCase().includes(q) || c.dial.startsWith(q) || c.code.toLowerCase() === q)) : countries.filter((c) => c.dial);
  }, [countries, query]);

  const pick = (code: string, newDial: string) => {
    setCountryOverride(code);
    setOpen(false);
    setQuery('');
    onChange(toE164(newDial, national));
  };

  return (
    <div className={cn('flex h-11 rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring', invalid ? 'border-destructive' : 'border-input')} dir="ltr">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex items-center gap-1 px-2.5 border-e border-input text-sm shrink-0 min-w-[84px] cursor-pointer hover:bg-muted rounded-s-md" aria-label={t('pp_calling_code')} aria-haspopup="listbox" aria-expanded={open}>
            <span aria-hidden>{flagEmoji(country?.code ?? '')}</span>
            <span className="tabular-nums">+{dial}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-72" align="start">
          <div className="flex items-center gap-2 px-3 border-b">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('pp_search_country_code')} className="h-10 flex-1 bg-transparent text-sm outline-none" dir="auto" />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.slice(0, 250).map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country?.code}>
                <button type="button" onClick={() => pick(c.code, c.dial)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-start hover:bg-muted cursor-pointer', c.code === country?.code && 'bg-primary/10')}>
                  <span aria-hidden>{flagEmoji(c.code)}</span><span className="flex-1 truncate">{c.en}</span><span className="text-muted-foreground tabular-nums">+{c.dial}</span>
                </button>
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-3 text-sm text-muted-foreground">{t('no_results')}</li>}
          </ul>
        </PopoverContent>
      </Popover>
      <Input
        id={id} type="tel" inputMode="tel" autoComplete="tel-national"
        value={national}
        onChange={(e) => onChange(toE164(dial, sanitizeNational(e.target.value, dial, country?.code)))}
        aria-invalid={invalid || undefined} aria-describedby={describedBy}
        className="border-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 rounded-s-none"
        placeholder={t('pp_phone_placeholder')}
      />
    </div>
  );
}
