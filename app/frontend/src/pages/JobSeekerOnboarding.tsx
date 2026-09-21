/**
 * Job Seeker Onboarding Journey
 * ============================================================
 * Resumable, mobile-first signup & onboarding flow driven by
 * src/lib/onboarding-engine.ts (step registry + state machine).
 *
 * Company onboarding is untouched. Every label is i18n (EN/AR).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BellRing, CheckCircle2, Crosshair, FileText, MapPin, Rocket,
  ShieldCheck, Sparkles, Star, Target, TrendingUp, BadgeCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores';
import { authService, profileService } from '@/services';
import {
  OnboardingLayout, OnboardingProgressHeader, StepHeading, StepBody, BottomActions,
  OtpInput, ChipMultiSelect, SkillPicker, CountryPicker, CountryMultiSelect,
  NativeDatePicker, ResumeUploader, RatingSelector, ToggleRow,
} from '@/components/onboarding/OnboardingKit';
import {
  useOnboardingStore, ONBOARDING_STEPS, STEP_ORDER, getStepDef,
  validateStep, computeProgress, computeProfileStrength, nextStepId, prevStepId,
  finalizeOnboarding, ageFromBirthDate, parseResumeText, requestGeolocation, nearestCountry,
  trackOnboarding, COUNTRIES, SKILL_TAXONOMY, ROLE_OPTIONS, WORK_STYLES, GENDERS,
  DISABILITIES, ACQUISITION_SOURCES, NOTIFICATION_TOPICS, SEEKER_PLAN_OPTIONS,
  type OnboardingStepId, type OnboardingDraft,
} from '@/lib/onboarding-engine';
import { cn } from '@/lib/utils';

const MAX_RESUME_MB = 10;
const ACCEPTED_EXT = ['pdf', 'doc', 'docx', 'txt'];

const groupLabelKey: Record<string, string> = {
  profile: 'ob_group_profile',
  about_you: 'ob_group_about_you',
  tune: 'ob_group_tune',
  launch: 'ob_group_launch',
};

const EDUCATION_OPTIONS = ['none', 'secondary', 'diploma', 'bachelor', 'master', 'phd'];

export default function JobSeekerOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, email } = useAuthStore();
  const { state, hydrated, hydrate, patchDraft, setStep, completeStep, sync } = useOnboardingStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const draft = state.draft;
  const stepId = state.currentStep;
  const def = getStepDef(stepId);

  // ---------- hydrate + start/resume analytics ----------
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const next = await hydrate(userId);
      if (!alive) return;
      if (!next.startedAt) {
        trackOnboarding(userId, 'onboarding_started', next.currentStep, { resumed: false });
      } else {
        trackOnboarding(userId, 'onboarding_resumed', next.currentStep, {});
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ---------- completed -> leave the journey ----------
  useEffect(() => {
    if (hydrated && state.completed) navigate('/seeker', { replace: true });
  }, [hydrated, state.completed, navigate]);

  // ---------- persistence safety net ----------
  useEffect(() => {
    if (!hydrated || !userId) return;
    const id = setTimeout(() => { sync(); }, 1200);
    return () => clearTimeout(id);
  }, [draft, hydrated, userId, sync]);

  const measurable = useMemo(() => STEP_ORDER.filter((s) => s !== 'welcome'), []);
  const stepNumber = Math.max(1, measurable.indexOf(stepId) + 1);
  const progress = computeProgress(state);

  const set = (patch: Partial<OnboardingDraft>) => patchDraft(patch);

  const goNext = async () => {
    const v = validateStep(stepId, draft);
    if (!v.valid) { setErrors(v.errors); return; }
    setErrors({});
    setBusy(true);
    try {
      if (stepId === 'tutorial') {
        await completeStep(userId!, 'tutorial', 'done');
        if (userId) await finalizeOnboarding(userId);
        navigate('/seeker', { replace: true });
        return;
      }
      await completeStep(userId!, stepId, 'done');
    } finally {
      setBusy(false);
    }
  };

  const goSkip = async () => {
    if (!def.skippable) return;
    setErrors({});
    setBusy(true);
    try {
      if (stepId === 'tutorial') {
        await completeStep(userId!, 'tutorial', 'skipped');
        if (userId) await finalizeOnboarding(userId);
        navigate('/seeker', { replace: true });
        return;
      }
      await completeStep(userId!, stepId, 'skipped');
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    const p = prevStepId(stepId);
    if (p) { setErrors({}); setStep(p); }
  };

  if (!userId) { navigate('/auth', { replace: true }); return null; }
  if (!hydrated) {
    // `hydrated` is released by the engine's bounded hydrate() in every outcome
    // (resolve, reject, or timeout), so this loader can no longer be permanent.
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  const isLast = stepId === 'tutorial';

  return (
    <OnboardingLayout
      chromeless={def.chromeless}
      footer={def.chromeless ? undefined : (
        <BottomActions
          onBack={prevStepId(stepId) ? goBack : undefined}
          onNext={goNext}
          onSkip={def.skippable ? goSkip : undefined}
          nextDisabled={busy}
          busy={busy}
          isLast={isLast}
          nextLabel={stepId === 'resume' ? t('ob_continue') : undefined}
        />
      )}
    >
      {!def.chromeless && (
        <OnboardingProgressHeader
          progress={progress}
          groupKey={groupLabelKey[def.group]}
          stepOf={{ current: stepNumber, total: measurable.length }}
        />
      )}

      <AnimatePresence mode="wait">
        <StepTransitioned key={stepId} stepId={stepId}>
          {/* ---------------- WELCOME ---------------- */}
          {stepId === 'welcome' && (
            <WelcomeStep email={email} onStart={() => completeStep(userId, 'welcome', 'done')} />
          )}

          {/* ---------------- RESUME ---------------- */}
          {stepId === 'resume' && (
            <>
              <StepHeading title={t('ob_resume_title')} subtitle={t('ob_resume_subtitle')} optional />
              <StepBody>
                <ResumeStep userId={userId} draft={draft} set={set} />
                <button
                  type="button"
                  onClick={() => { set({ resume: { ...draft.resume, parsed: false } }); completeStep(userId, 'resume', 'skipped'); }}
                  className="mt-5 w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('ob_resume_manual')}
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">{t('ob_resume_skip_hint')}</p>
              </StepBody>
            </>
          )}

          {/* ---------------- REVIEW ---------------- */}
          {stepId === 'review' && (
            <>
              <StepHeading title={t('ob_review_title')} subtitle={t('ob_review_subtitle')} />
              <StepBody>
                <ReviewStep draft={draft} set={set} />
              </StepBody>
            </>
          )}

          {/* ---------------- BASICS ---------------- */}
          {stepId === 'basics' && (
            <>
              <StepHeading title={t('ob_basics_title')} subtitle={t('ob_basics_subtitle')} />
              <StepBody>
                <div className="space-y-5">
                  <Field label={t('ob_full_name')} error={errors.full_name ? t(errors.full_name) : undefined}>
                    <Input
                      value={draft.full_name}
                      onChange={(e) => set({ full_name: e.target.value })}
                      placeholder={t('ob_full_name_placeholder')}
                      className="h-12"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label={t('ob_headline')}>
                    <Input
                      value={draft.headline}
                      onChange={(e) => set({ headline: e.target.value })}
                      placeholder={t('ob_headline_placeholder')}
                      className="h-12"
                    />
                  </Field>
                  <Field label={t('ob_skills')} hint={t('ob_skills_hint')} error={errors.skills ? t(errors.skills) : undefined}>
                    <SkillPicker skills={draft.skills} onChange={(s) => set({ skills: s })} taxonomy={SKILL_TAXONOMY} />
                  </Field>
                  <Field label={t('ob_experience')}>
                    <div className="pt-2">
                      <Slider
                        value={[draft.experience_years ?? 0]}
                        onValueChange={([v]) => set({ experience_years: v })}
                        max={40} step={1}
                      />
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {draft.experience_years === 0 ? t('ob_less_than_year') : t('ob_years', { count: draft.experience_years ?? 0 })}
                      </p>
                    </div>
                  </Field>
                  <Field label={t('ob_education')}>
                    <ChipMultiSelect
                      options={EDUCATION_OPTIONS.map((v) => ({ value: v, label: t(`ob_edu_${v}`) }))}
                      selected={[draft.education || 'none']}
                      onToggle={(v) => set({ education: v })}
                      max={1}
                    />
                  </Field>
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- DEMOGRAPHICS ---------------- */}
          {stepId === 'demographics' && (
            <>
              <StepHeading title={t('ob_demo_title')} subtitle={t('ob_demo_subtitle')} optional />
              <StepBody>
                <div className="space-y-6">
                  <Field label={t('ob_gender')}>
                    <ChipMultiSelect
                      options={GENDERS.map((v) => ({ value: v, label: t(v === 'male' ? 'ob_gender_male' : v === 'female' ? 'ob_gender_female' : 'ob_gender_na') }))}
                      selected={draft.gender ? [draft.gender] : []}
                      onToggle={(v) => set({ gender: draft.gender === v ? null : v })}
                      max={1}
                    />
                  </Field>
                  <Field label={t('ob_disability')}>
                    <ChipMultiSelect
                      options={DISABILITIES.map((v) => ({ value: v, label: t(`ob_disab_${v === 'prefer_not_to_say' ? 'na' : v}`) }))}
                      selected={draft.disability ? [draft.disability] : []}
                      onToggle={(v) => set({ disability: draft.disability === v ? null : v })}
                      max={1}
                    />
                  </Field>
                  <Field label={t('ob_acquisition')}>
                    <ChipMultiSelect
                      options={ACQUISITION_SOURCES.map((v) => ({ value: v, label: t(`ob_acq_${v}`) }))}
                      selected={draft.acquisition_source ? [draft.acquisition_source] : []}
                      onToggle={(v) => set({ acquisition_source: draft.acquisition_source === v ? null : v })}
                      max={1}
                    />
                    {draft.acquisition_source === 'other' && (
                      <Input
                        value={draft.acquisition_other}
                        onChange={(e) => set({ acquisition_other: e.target.value })}
                        placeholder={t('ob_acq_other_placeholder')}
                        className="h-12 mt-3"
                      />
                    )}
                  </Field>
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- BIRTHDAY ---------------- */}
          {stepId === 'birthday' && (
            <>
              <StepHeading title={t('ob_birthday_title')} subtitle={t('ob_birthday_subtitle')} />
              <StepBody>
                <div className="space-y-4">
                  <Field label={t('ob_birthday_label')} error={errors.birth_date ? t(errors.birth_date) : undefined} hint={t('ob_birthday_hint')}>
                    <NativeDatePicker
                      value={draft.birth_date}
                      onChange={(v) => set({ birth_date: v })}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                  {draft.birth_date && ageFromBirthDate(draft.birth_date) !== null && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      <BadgeCheck className="h-4 w-4" />
                      {t('ob_age_badge', { age: ageFromBirthDate(draft.birth_date)! })}
                    </div>
                  )}
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- LOCATION ---------------- */}
          {stepId === 'location' && (
            <>
              <StepHeading title={t('ob_location_title')} subtitle={t('ob_location_subtitle')} />
              <StepBody>
                <div className="space-y-4">
                  <LocationStep draft={draft} set={set} userId={userId} />
                  <Field label={t('ob_city')} error={errors.city ? t(errors.city) : undefined}>
                    <Input
                      value={draft.city}
                      onChange={(e) => set({ city: e.target.value })}
                      placeholder={t('ob_city_placeholder')}
                      className="h-12"
                      autoComplete="address-level2"
                    />
                  </Field>
                  {errors.country && <p className="text-xs text-destructive">{t(errors.country)}</p>}
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- TARGET COUNTRIES ---------------- */}
          {stepId === 'target_countries' && (
            <>
              <StepHeading title={t('ob_target_title')} subtitle={t('ob_target_subtitle')} />
              <StepBody>
                <CountryMultiSelect
                  selected={draft.target_countries}
                  onToggle={(code) => set({
                    target_countries: draft.target_countries.includes(code)
                      ? draft.target_countries.filter((c) => c !== code)
                      : [...draft.target_countries, code],
                  })}
                />
                {errors.target_countries && <p className="mt-3 text-xs text-destructive">{t(errors.target_countries)}</p>}
              </StepBody>
            </>
          )}

          {/* ---------------- PREFERENCES ---------------- */}
          {stepId === 'preferences' && (
            <>
              <StepHeading title={t('ob_prefs_title')} subtitle={t('ob_prefs_subtitle')} />
              <StepBody>
                <div className="space-y-6">
                  <Field label={t('ob_roles')} error={errors.desired_roles ? t(errors.desired_roles) : undefined}>
                    <ChipMultiSelect
                      options={ROLE_OPTIONS.map((v) => ({ value: v, label: v }))}
                      selected={draft.desired_roles}
                      onToggle={(v) => set({
                        desired_roles: draft.desired_roles.includes(v)
                          ? draft.desired_roles.filter((x) => x !== v)
                          : [...draft.desired_roles, v],
                      })}
                      max={5}
                    />
                  </Field>
                  <Field label={t('ob_work_styles')} error={errors.work_styles ? t(errors.work_styles) : undefined}>
                    <ChipMultiSelect
                      options={WORK_STYLES.map((v) => ({ value: v, label: t(`ob_ws_${v}`) }))}
                      selected={draft.work_styles}
                      onToggle={(v) => set({
                        work_styles: draft.work_styles.includes(v)
                          ? draft.work_styles.filter((x) => x !== v)
                          : [...draft.work_styles, v],
                      })}
                      max={4}
                    />
                  </Field>
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- NOTIFICATIONS ---------------- */}
          {stepId === 'notifications' && (
            <>
              <StepHeading title={t('ob_notif_title')} subtitle={t('ob_notif_subtitle')} optional />
              <StepBody>
                <NotificationStep draft={draft} set={set} userId={userId} />
              </StepBody>
            </>
          )}

          {/* ---------------- RATING ---------------- */}
          {stepId === 'rating' && (
            <>
              <StepHeading title={t('ob_rating_title')} subtitle={t('ob_rating_subtitle')} />
              <StepBody>
                <div className="space-y-5 pt-2">
                  <RatingSelector value={draft.job_search_rating} onChange={(v) => set({ job_search_rating: v })} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('ob_rating_scale')}</span>
                    <span>{t('ob_rating_scale_max')}</span>
                  </div>
                  {errors.rating && <p className="text-xs text-destructive">{t(errors.rating)}</p>}
                  <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{t('ob_rating_hint')}</p>
                  </div>
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- PLAN ---------------- */}
          {stepId === 'plan' && (
            <>
              <StepHeading title={t('ob_plan_title')} subtitle={t('ob_plan_subtitle')} optional />
              <StepBody>
                <div className="space-y-3">
                  {SEEKER_PLAN_OPTIONS.map((p) => {
                    const active = draft.plan === p.id;
                    const label = p.id === 'seeker-free' ? t('ob_plan_free') : p.id === 'seeker_premium' ? t('ob_plan_premium') : t('ob_plan_premium_plus');
                    const desc = p.id === 'seeker-free' ? t('ob_plan_free_desc') : p.id === 'seeker_premium' ? t('ob_plan_premium_desc') : t('ob_plan_premium_plus_desc');
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { set({ plan: p.id }); trackOnboarding(userId, 'plan_selected', 'plan', { plan: p.id }); }}
                        className={cn(
                          'w-full text-start rounded-2xl border-2 p-4 transition-all active:scale-[0.99]',
                          active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                          </div>
                          <div className="text-end shrink-0">
                            <p className="text-lg font-extrabold text-primary">
                              {p.price === 0 ? '0' : `$${p.price}`}
                              <span className="text-xs font-medium text-muted-foreground">{t('ob_plan_per_month')}</span>
                            </p>
                            {active && <span className="text-[11px] font-semibold text-primary">{t('ob_plan_current')}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <div className="flex items-start gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700 dark:text-green-400">{t('ob_plan_credits')}</p>
                  </div>
                </div>
              </StepBody>
            </>
          )}

          {/* ---------------- TUTORIAL ---------------- */}
          {stepId === 'tutorial' && (
            <>
              <StepHeading title={t('ob_tutorial_title')} subtitle={t('ob_tutorial_subtitle')} />
              <StepBody>
                <TutorialStep draft={draft} />
              </StepBody>
            </>
          )}
        </StepTransitioned>
      </AnimatePresence>
    </OnboardingLayout>
  );
}

// ============================================================
// Step transition wrapper (framer-motion, RTL-safe)
// ============================================================

function StepTransitioned({ stepId, children }: { stepId: string; children: React.ReactNode }) {
  return (
    <motion.div
      key={stepId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex-1 flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// Shared field wrapper
// ============================================================

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// Welcome (chromeless)
// ============================================================

function WelcomeStep({ email, onStart }: { email: string | null; onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 mb-6"
      >
        <Sparkles className="h-10 w-10 text-primary-foreground" />
      </motion.div>
      <h1 className="text-3xl font-extrabold tracking-tight font-[Poppins] text-foreground">
        {t('ob_welcome_title')}
      </h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-sm">
        {t('ob_welcome_subtitle')}
      </p>
      {email && <p className="mt-2 text-xs text-muted-foreground">{email}</p>}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
        <Button onClick={onStart} className="w-full h-13 py-4 text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl">
          <Rocket className="h-5 w-5" />
          {t('ob_get_started')}
        </Button>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('ob_resume_in_2_min')}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Resume upload + parse
// ============================================================

function ResumeStep({ userId, draft, set }: {
  userId: string; draft: OnboardingDraft; set: (p: Partial<OnboardingDraft>) => void;
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState<{ name: string; size: number } | null>(
    draft.resume.fileName ? { name: draft.resume.fileName, size: 0 } : null
  );
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (f: File) => {
    setError(null);
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_EXT.includes(ext)) { setError(t('ob_err_file_type')); return; }
    if (f.size > MAX_RESUME_MB * 1024 * 1024) { setError(t('ob_err_file_size', { size: MAX_RESUME_MB })); return; }

    setFile({ name: f.name, size: f.size });
    setParsing(true);
    try {
      const { data, error: upErr } = await profileService.uploadCV(userId, f);
      const cvUrl = (data as any)?.publicUrl;
      if (upErr) { setError(upErr.message); }

      let extract: Record<string, unknown> = { fileName: f.name, cvUrl, parsed: false };
      if (ext === 'txt') {
        const text = await f.text();
        const parsed = parseResumeText(text);
        extract = { ...extract, ...parsed, cvUrl };
        // Prefill canonical draft fields from parsed values
        const patch: Partial<OnboardingDraft> = { resume: extract as any };
        if (parsed.full_name && !draft.full_name) patch.full_name = parsed.full_name;
        if (parsed.headline && !draft.headline) patch.headline = parsed.headline;
        if (parsed.skills?.length && draft.skills.length === 0) patch.skills = parsed.skills;
        if (parsed.experience_years != null && draft.experience_years === null) patch.experience_years = parsed.experience_years;
        if (parsed.education && !draft.education) patch.education = parsed.education;
        set(patch);
      } else {
        set({ resume: extract as any });
        toast.info(t('ob_resume_parse_failed'));
      }
      trackOnboarding(userId, 'resume_parsed', 'resume', {
        ext, fields: Object.keys(extract).filter((k) => k !== 'fileName' && k !== 'cvUrl' && k !== 'parsed'),
      });
    } catch (err: any) {
      setError(err?.message ?? t('ob_resume_parse_failed'));
      set({ resume: { fileName: f.name, parsed: false } });
    } finally {
      setParsing(false);
    }
  };

  return (
    <ResumeUploader
      file={file}
      parsing={parsing}
      error={error}
      onPick={handlePick}
      onRemove={() => { setFile(null); set({ resume: {} }); }}
    />
  );
}

// ============================================================
// Review extracted values
// ============================================================

function ReviewStep({ draft, set }: { draft: OnboardingDraft; set: (p: Partial<OnboardingDraft>) => void }) {
  const { t } = useTranslation();
  const r = draft.resume;
  const hasAnything = !!(r.full_name || r.headline || r.skills?.length || r.experience_years != null || r.education);

  if (!hasAnything) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">{t('ob_review_none')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {r.full_name && (
        <Field label={t('ob_review_name')}>
          <Input value={draft.full_name || r.full_name} onChange={(e) => set({ full_name: e.target.value })} className="h-12" />
        </Field>
      )}
      {r.headline && (
        <Field label={t('ob_review_headline')}>
          <Input value={draft.headline || r.headline} onChange={(e) => set({ headline: e.target.value })} className="h-12" />
        </Field>
      )}
      {r.skills?.length ? (
        <Field label={t('ob_review_skills')}>
          <ChipMultiSelect
            options={r.skills.map((s) => ({ value: s, label: s }))}
            selected={draft.skills.length ? draft.skills : r.skills}
            onToggle={(v) => set({ skills: (draft.skills.length ? draft.skills : r.skills!).includes(v)
              ? (draft.skills.length ? draft.skills : r.skills!).filter((x) => x !== v)
              : [...(draft.skills.length ? draft.skills : r.skills!), v] })}
          />
        </Field>
      ) : null}
      {r.experience_years != null && (
        <ReviewRow icon={<TrendingUp className="h-4 w-4" />} label={t('ob_review_experience')} value={t('ob_years', { count: r.experience_years })} />
      )}
      {r.education && (
        <ReviewRow icon={<BadgeCheck className="h-4 w-4" />} label={t('ob_review_education')} value={t(`ob_edu_${r.education}`)} />
      )}
    </div>
  );
}

function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// ============================================================
// Location (permission + geolocation -> nearest country)
// ============================================================

function LocationStep({ draft, set, userId }: {
  draft: OnboardingDraft; set: (p: Partial<OnboardingDraft>) => void; userId: string;
}) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    const pos = await requestGeolocation();
    setLocating(false);
    if (!pos) {
      set({ country: draft.country });
      toast.error(t('ob_location_denied'));
      trackOnboarding(userId, 'location_permission', 'location', { granted: false });
      return;
    }
    const near = nearestCountry(pos.lat, pos.lng);
    set({ country: near.code });
    toast.success(t('ob_location_granted'));
    trackOnboarding(userId, 'location_permission', 'location', { granted: true, matched_country: near.code });
  };

  return (
    <div className="space-y-3">
      <Field label={t('ob_country')}>
        <CountryPicker value={draft.country} onChange={(code) => set({ country: code })} />
      </Field>
      <Button
        type="button"
        variant="outline"
        onClick={useMyLocation}
        disabled={locating}
        className="w-full h-12 gap-2 rounded-xl"
      >
        <Crosshair className={cn('h-4 w-4', locating && 'animate-spin')} />
        {locating ? t('ob_locating') : t('ob_use_location')}
      </Button>
      {draft.country && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {COUNTRIES.find((c) => c.code === draft.country)?.en}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Notifications (permission education + topics)
// ============================================================

function NotificationStep({ draft, set, userId }: {
  draft: OnboardingDraft; set: (p: Partial<OnboardingDraft>) => void; userId: string;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(draft.notification_permission);

  const enable = async () => {
    if (typeof Notification === 'undefined') {
      set({ notification_permission: 'unsupported' });
      setStatus('unsupported');
      trackOnboarding(userId, 'notification_permission', 'notifications', { result: 'unsupported' });
      return;
    }
    if (Notification.permission === 'granted') {
      set({ notification_permission: 'granted' }); setStatus('granted');
    } else if (Notification.permission === 'denied') {
      set({ notification_permission: 'denied' }); setStatus('denied');
    } else {
      const res = await Notification.requestPermission();
      set({ notification_permission: res === 'granted' ? 'granted' : 'denied' });
      setStatus(res === 'granted' ? 'granted' : 'denied');
    }
    trackOnboarding(userId, 'notification_permission', 'notifications', { result: status });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <BellRing className="h-7 w-7 text-primary" />
        </span>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('ob_notif_perm_hint')}</p>
        <Button onClick={enable} className="mt-4 w-full h-12 font-semibold rounded-xl gap-2">
          {t('ob_notif_enable')}
        </Button>
        {status === 'granted' && <p className="mt-2 text-xs font-semibold text-green-600">{t('ob_notif_granted')}</p>}
        {status === 'denied' && <p className="mt-2 text-xs text-destructive">{t('ob_notif_denied')}</p>}
        {status === 'unsupported' && <p className="mt-2 text-xs text-muted-foreground">{t('ob_notif_unsupported')}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('ob_notif_topics')}</Label>
        {NOTIFICATION_TOPICS.map((topic) => (
          <ToggleRow
            key={topic}
            label={t(`ob_nt_${topic}`)}
            checked={!!draft.notifications[topic]}
            onChange={(v) => set({ notifications: { ...draft.notifications, [topic]: v } })}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Discover tutorial + profile strength
// ============================================================

function TutorialStep({ draft }: { draft: OnboardingDraft }) {
  const { t } = useTranslation();
  const { score, hints } = computeProfileStrength(draft);
  const cards = [
    { key: '1', icon: <Target className="h-5 w-5" />, title: t('ob_tut1_title'), desc: t('ob_tut1_desc') },
    { key: '2', icon: <Star className="h-5 w-5" />, title: t('ob_tut2_title'), desc: t('ob_tut2_desc') },
    { key: '3', icon: <FileText className="h-5 w-5" />, title: t('ob_tut3_title'), desc: t('ob_tut3_desc') },
  ];
  return (
    <div className="space-y-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-start gap-4 rounded-2xl border bg-card p-4"
        >
          <span className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{c.icon}</span>
          <div>
            <p className="font-bold text-sm">{c.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
          </div>
        </motion.div>
      ))}

      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-sm">{t('ob_completion_title')}</p>
          <span className="text-sm font-extrabold text-primary">{score}%</span>
        </div>
        <Progress value={score} className="h-2" aria-label={t('ob_strength')} />
        {hints.length > 0 && (
          <ul className="mt-3 space-y-1">
            {hints.slice(0, 3).map((h) => (
              <li key={h} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {t(h)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
