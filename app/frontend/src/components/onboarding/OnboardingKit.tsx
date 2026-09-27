/**
 * Onboarding UI Kit — reusable building blocks for the Job Seeker journey.
 * Mobile-first (320–412px safe), RTL-aware, keyboard-friendly, MatchMe branded.
 * All copy comes from i18n keys — no hardcoded strings.
 */

import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Globe2, Search,
  Sparkles, Upload, X, Apple, Mail, Phone,
} from 'lucide-react';
import { Star as RatingStar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { COUNTRIES, type CountryOption } from '@/lib/onboarding-engine';

// ============================================================
// Layout — viewport-locked, safe-area aware
// ============================================================

export function OnboardingLayout({
  children, footer, chromeless = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  chromeless?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-background overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Top safe area */}
      <div className="shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }} />
      <div className={cn('flex-1 flex flex-col min-h-0', !chromeless && 'px-4')}>
        {children}
      </div>
      {footer && (
        <div
          className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur px-4 pt-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Progress header
// ============================================================

export function OnboardingProgressHeader({
  progress, groupKey, stepOf,
}: {
  progress: number;
  groupKey: string;
  stepOf: { current: number; total: number };
}) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 pt-4 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          {t(groupKey)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t('ob_step_of', { current: stepOf.current, total: stepOf.total })}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" aria-label={t('ob_progress_label')} />
    </div>
  );
}

// ============================================================
// Step heading (title + subtitle)
// ============================================================

export function StepHeading({
  title, subtitle, optional = false,
}: {
  title: string; subtitle?: string; optional?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 mt-4 mb-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-[Poppins]">{title}</h1>
        {optional && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {t('ob_optional')}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// ============================================================
// Scrollable content area
// ============================================================

export function StepBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-4 [-webkit-overflow-scrolling:touch]">
      {children}
    </div>
  );
}

// ============================================================
// Bottom action bar (Back / Continue / Skip)
// ============================================================

export function BottomActions({
  onBack, onNext, onSkip, nextLabel, skipLabel, nextDisabled = false, busy = false, isLast = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  isLast?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} aria-label={t('ob_back')} className="shrink-0 rtl:rotate-180">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      {onSkip && (
        <Button variant="ghost" onClick={onSkip} className="shrink-0 text-muted-foreground">
          {skipLabel ?? t('ob_skip')}
        </Button>
      )}
      <Button
        onClick={onNext}
        disabled={nextDisabled || busy}
        className="flex-1 h-12 text-base font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {busy && <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />}
        {nextLabel ?? (isLast ? t('ob_finish') : t('ob_continue'))}
        {!busy && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
      </Button>
    </div>
  );
}

// ============================================================
// Signup method buttons (Apple / Google / Phone / Email)
// ============================================================

export function SignupMethodButton({
  kind, onClick, disabled,
}: {
  kind: 'apple' | 'google' | 'phone' | 'email';
  onClick: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const conf = {
    apple: { label: t('ob_continue_apple'), icon: <Apple className="h-5 w-5" />, cls: 'bg-black text-white hover:bg-black/85 border-transparent' },
    google: {
      label: t('ob_continue_google'),
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
        </svg>
      ),
      cls: 'bg-white text-foreground hover:bg-muted border-border',
    },
    phone: { label: t('ob_continue_phone'), icon: <Phone className="h-5 w-5" />, cls: 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent' },
    email: { label: t('ob_continue_email'), icon: <Mail className="h-5 w-5" />, cls: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent' },
  }[kind];
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn('w-full h-12 text-base font-semibold gap-3 justify-center', conf.cls)}
    >
      {conf.icon}
      {conf.label}
    </Button>
  );
}

// ============================================================
// OTP input (6 digits, auto-submit on complete)
// ============================================================

export function OtpInput({ value, onChange, onComplete }: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
}) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={(v) => {
        onChange(v);
        if (v.length === 6) onComplete?.(v);
      }}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg font-bold" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

// ============================================================
// Chip multi-select (skills / roles / work styles / countries)
// ============================================================

export function ChipMultiSelect({
  options, selected, onToggle, max = 20,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.value);
        const locked = !active && selected.length >= max;
        return (
          <button
            key={o.value}
            type="button"
            disabled={locked}
            onClick={() => onToggle(o.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-95 min-h-[44px]',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-foreground hover:border-primary/50',
              locked && 'opacity-40'
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Searchable skill combobox (taxonomy + free text)
// ============================================================

export function SkillPicker({ skills, onChange, taxonomy }: {
  skills: string[];
  onChange: (s: string[]) => void;
  taxonomy: string[];
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const suggestions = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    return taxonomy
      .filter((s) => s.toLowerCase().includes(ql) && !skills.includes(s))
      .slice(0, 6);
  }, [q, skills, taxonomy]);

  const add = (s: string) => {
    const v = s.trim();
    if (v && !skills.includes(v) && skills.length < 20) onChange([...skills, v]);
    setQ('');
  };

  return (
    <div className="space-y-3">
      {skills.length > 0 && (
        <ChipMultiSelect
          options={skills.map((s) => ({ value: s, label: s }))}
          selected={skills}
          onToggle={(v) => onChange(skills.filter((x) => x !== v))}
        />
      )}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(suggestions[0] ?? q); }
          }}
          placeholder={t('ob_skills_search')}
          className="ps-9 h-12"
          inputMode="search"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-20 inset-x-0 top-full mt-1 rounded-xl border bg-card shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="w-full text-start px-4 py-3 text-sm hover:bg-muted active:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t('ob_skills_selected', { count: skills.length })}</p>
    </div>
  );
}

// ============================================================
// Country picker (single, searchable) — used for residence
// ============================================================

export function CountryPicker({ value, onChange, exclude = [] }: {
  value: string | null;
  onChange: (code: string) => void;
  exclude?: string[];
}) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const isAr = i18n.language === 'ar';
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return COUNTRIES
      .filter((c) => !exclude.includes(c.code))
      .filter((c) => !ql || c.en.toLowerCase().includes(ql) || c.ar.includes(q.trim()) || c.code.toLowerCase().includes(ql));
  }, [q, exclude]);
  const selected = COUNTRIES.find((c) => c.code === value);

  return (
    <div className="relative">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-12 rounded-xl border border-border bg-card px-4 flex items-center justify-between text-sm"
        >
          <span className={cn('flex items-center gap-2', !selected && 'text-muted-foreground')}>
            {selected ? <Globe2 className="h-4 w-4 text-primary" /> : <Search className="h-4 w-4" />}
            {selected ? (isAr ? selected.ar : selected.en) : t('ob_country')}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {open && (
        <div className="z-30">
          <div className="relative mb-2">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('ob_search_country')}
              className="ps-9 h-12"
            />
            <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-9 w-9" onClick={() => setOpen(false)} aria-label={t('close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border bg-card divide-y divide-border/60">
            {list.length === 0 && <p className="p-4 text-sm text-muted-foreground text-center">{t('ob_no_results')}</p>}
            {list.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setQ(''); }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted active:bg-muted"
              >
                <span>{isAr ? c.ar : c.en}</span>
                <span className="text-xs text-muted-foreground tabular-nums">+{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Target countries (multi-select grid with search)
// ============================================================

export function CountryMultiSelect({ selected, onToggle }: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const isAr = i18n.language === 'ar';
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return COUNTRIES.filter((c) => !ql || c.en.toLowerCase().includes(ql) || c.ar.includes(q.trim()) || c.code.toLowerCase().includes(ql));
  }, [q]);
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ob_search_country')} className="ps-9 h-12" />
      </div>
      <p className="text-xs text-muted-foreground">{t('ob_target_selected', { count: selected.length })}</p>
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto rounded-xl border bg-card p-2">
        {list.map((c: CountryOption) => {
          const active = selected.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onToggle(c.code)}
              aria-pressed={active}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm min-h-[44px] transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <span className="truncate">{isAr ? c.ar : c.en}</span>
              {active && <Check className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Native date picker (keyboard + mobile wheel friendly)
// ============================================================

export function NativeDatePicker({ value, onChange, max }: {
  value: string; onChange: (v: string) => void; max?: string;
}) {
  return (
    <Input
      type="date"
      value={value}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 text-base"
      inputMode="numeric"
    />
  );
}

// ============================================================
// Resume uploader (drag/tap, type + size validation)
// ============================================================

export function ResumeUploader({
  file, onPick, onRemove, parsing, error,
}: {
  file: { name: string; size: number } | null;
  onPick: (f: File) => void;
  onRemove: () => void;
  parsing?: boolean;
  error?: string | null;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
      />
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-3 active:scale-[0.99] transition-transform"
        >
          <span className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </span>
          <span className="font-semibold text-sm">{t('ob_resume_upload')}</span>
          <span className="text-xs text-muted-foreground">{t('ob_resume_drag')}</span>
          <span className="text-[11px] text-muted-foreground">{t('ob_resume_formats')} · {t('ob_resume_max', { size: 10 })}</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {parsing ? <Sparkles className="h-5 w-5 text-primary animate-pulse" /> : <Check className="h-5 w-5 text-green-600" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {parsing ? t('ob_resume_parsing') : t('ob_resume_uploaded')} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={t('ob_resume_remove')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// Rating selector (1..5)
// ============================================================

/** 1–5 star App Experience rating. `labels[n-1]` gives each value's meaning for screen readers. */
export function RatingSelector({ value, onChange, labels, ariaLabel }: {
  value: number | null; onChange: (v: number) => void; labels: string[]; ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2" role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} / 5 – ${labels[n - 1] ?? ''}`}
          data-rating={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RatingStar
            className={cn('h-10 w-10 transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Toggle row (notification topics)
// ============================================================

export function ToggleRow({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ============================================================
// Animated step transition wrapper
// ============================================================

export function StepTransition({ stepId, children }: { stepId: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={stepId}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex-1 flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
}
