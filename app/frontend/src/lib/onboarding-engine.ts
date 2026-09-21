/**
 * Job Seeker Onboarding Engine
 * ============================================================
 * Single orchestration layer for the resumable Job Seeker signup &
 * onboarding journey. Reuses canonical systems:
 *  - Supabase Auth (auth.service) for email / Apple / Google / phone-OTP
 *  - profile.service for user_profiles + job_seeker_profiles persistence
 *  - billing-engine seeker plans for the plan step
 *  - i18n (EN/AR) for every label — no hardcoded copy
 *  - onboarding_events table for privacy-conscious analytics
 *
 * Company onboarding is intentionally NOT touched by this engine.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/services/api-client';
import { profileService } from '@/services/profile.service';
import { logger } from '@/lib/logger';
import { BOOTSTRAP_TIMEOUT_MS, withTimeout } from '@/lib/signup-flow';

// ============================================================
// Versioning
// ============================================================

export const ONBOARDING_VERSION = '1.0';

// ============================================================
// Canonical option registries (single source for onboarding UI)
// ============================================================

export interface CountryOption {
  code: string;
  en: string;
  ar: string;
  dial: string;
  lat: number;
  lng: number;
}

/** Residency + target-country registry with centroids for offline geolocation matching. */
export const COUNTRIES: CountryOption[] = [
  { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية', dial: '966', lat: 24.7136, lng: 46.6753 },
  { code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات', dial: '971', lat: 25.2048, lng: 55.2708 },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت', dial: '965', lat: 29.3759, lng: 47.9774 },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين', dial: '973', lat: 26.0667, lng: 50.5577 },
  { code: 'QA', en: 'Qatar', ar: 'قطر', dial: '974', lat: 25.2854, lng: 51.531 },
  { code: 'OM', en: 'Oman', ar: 'عُمان', dial: '968', lat: 23.588, lng: 58.3829 },
  { code: 'EG', en: 'Egypt', ar: 'مصر', dial: '20', lat: 30.0444, lng: 31.2357 },
  { code: 'JO', en: 'Jordan', ar: 'الأردن', dial: '962', lat: 31.9539, lng: 35.9106 },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان', dial: '961', lat: 33.8938, lng: 35.5018 },
  { code: 'IQ', en: 'Iraq', ar: 'العراق', dial: '964', lat: 33.3152, lng: 44.3661 },
  { code: 'MA', en: 'Morocco', ar: 'المغرب', dial: '212', lat: 33.9716, lng: -6.8498 },
  { code: 'TN', en: 'Tunisia', ar: 'تونس', dial: '216', lat: 36.8065, lng: 10.1815 },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر', dial: '213', lat: 36.7538, lng: 3.0588 },
  { code: 'PK', en: 'Pakistan', ar: 'باكستان', dial: '92', lat: 33.6844, lng: 73.0479 },
  { code: 'IN', en: 'India', ar: 'الهند', dial: '91', lat: 28.6139, lng: 77.209 },
  { code: 'BD', en: 'Bangladesh', ar: 'بنغلاديش', dial: '880', lat: 23.8103, lng: 90.4125 },
  { code: 'PH', en: 'Philippines', ar: 'الفلبين', dial: '63', lat: 14.5995, lng: 120.9842 },
  { code: 'NP', en: 'Nepal', ar: 'نيبال', dial: '977', lat: 27.7172, lng: 85.324 },
  { code: 'LK', en: 'Sri Lanka', ar: 'سريلانكا', dial: '94', lat: 6.9271, lng: 79.8612 },
  { code: 'TR', en: 'Turkey', ar: 'تركيا', dial: '90', lat: 39.9334, lng: 32.8597 },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة', dial: '44', lat: 51.5074, lng: -0.1278 },
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة', dial: '1', lat: 38.9072, lng: -77.0369 },
  { code: 'CA', en: 'Canada', ar: 'كندا', dial: '1', lat: 45.4215, lng: -75.6972 },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا', dial: '49', lat: 52.52, lng: 13.405 },
  { code: 'FR', en: 'France', ar: 'فرنسا', dial: '33', lat: 48.8566, lng: 2.3522 },
];

/** Popular skills taxonomy used by resume parsing + the skills picker. */
export const SKILL_TAXONOMY: string[] = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'Kotlin', 'Swift',
  'Flutter', 'React Native', 'PHP', 'Laravel', 'Django', '.NET', 'SQL', 'PostgreSQL',
  'MongoDB', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'Linux',
  'UI/UX Design', 'Figma', 'Adobe XD', 'Graphic Design', 'Product Management', 'Agile',
  'Scrum', 'Data Analysis', 'Data Science', 'Machine Learning', 'AI/ML', 'Power BI',
  'Excel', 'Digital Marketing', 'SEO', 'Content Writing', 'Copywriting', 'Social Media',
  'Sales', 'Business Development', 'Accounting', 'Finance', 'HR Management', 'Recruitment',
  'Project Management', 'Customer Service', 'Microsoft Office', 'Communication', 'Leadership',
];

export const ROLE_OPTIONS = [
  'Software Development', 'Data & AI', 'Design & UX', 'Product Management',
  'Marketing & Content', 'Sales & Business', 'Finance & Accounting', 'HR & Recruitment',
  'Customer Support', 'Healthcare', 'Engineering', 'Operations & Admin',
];

export const WORK_STYLES = ['full_time', 'part_time', 'contract', 'remote', 'hybrid', 'onsite'] as const;

export const GENDERS = ['male', 'female', 'prefer_not_to_say'] as const;
export const DISABILITIES = ['none', 'visual', 'hearing', 'mobility', 'cognitive', 'other', 'prefer_not_to_say'] as const;
export const ACQUISITION_SOURCES = ['friend', 'linkedin', 'google', 'tiktok', 'instagram', 'twitter', 'university', 'recruiter', 'other'] as const;
export const NOTIFICATION_TOPICS = ['job_matches', 'new_messages', 'application_updates', 'weekly_digest'] as const;

/** Seeker plans shown in the plan step (mirrors billing-engine seeker tiers). */
export const SEEKER_PLAN_OPTIONS = [
  { id: 'seeker-free', price: 0 },
  { id: 'seeker_premium', price: 19 },
  { id: 'seeker_premium_plus', price: 29 },
] as const;

// ============================================================
// Step registry (declarative config-over-code)
// ============================================================

export type OnboardingStepId =
  | 'welcome' | 'resume' | 'review' | 'basics'
  | 'demographics' | 'birthday' | 'location' | 'target_countries'
  | 'preferences' | 'notifications' | 'rating' | 'plan' | 'tutorial';

export interface StepDefinition {
  id: OnboardingStepId;
  group: 'profile' | 'about_you' | 'tune' | 'launch';
  /** Whether the user may skip this step. */
  skippable: boolean;
  /** Whether the step is the first screen (no progress shown). */
  chromeless?: boolean;
}

export const ONBOARDING_STEPS: StepDefinition[] = [
  { id: 'welcome', group: 'profile', skippable: false, chromeless: true },
  { id: 'resume', group: 'profile', skippable: true },
  { id: 'review', group: 'profile', skippable: true },
  { id: 'basics', group: 'profile', skippable: false },
  { id: 'demographics', group: 'about_you', skippable: true },
  { id: 'birthday', group: 'about_you', skippable: false },
  { id: 'location', group: 'about_you', skippable: false },
  { id: 'target_countries', group: 'about_you', skippable: false },
  { id: 'preferences', group: 'tune', skippable: false },
  { id: 'notifications', group: 'tune', skippable: true },
  { id: 'rating', group: 'launch', skippable: false },
  { id: 'plan', group: 'launch', skippable: true },
  { id: 'tutorial', group: 'launch', skippable: true },
];

export const getStepDef = (id: OnboardingStepId) =>
  ONBOARDING_STEPS.find((s) => s.id === id) ?? ONBOARDING_STEPS[0];

// ============================================================
// State types
// ============================================================

export type StepStatus = 'done' | 'skipped';

export interface ResumeExtract {
  fileName?: string;
  cvUrl?: string;
  parsed?: boolean;
  full_name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience_years?: number;
  education?: string;
  city?: string;
  country?: string;
}

export interface OnboardingDraft {
  full_name: string;
  headline: string;
  skills: string[];
  experience_years: number | null;
  education: string;
  resume: ResumeExtract;
  gender: string | null;
  disability: string | null;
  acquisition_source: string | null;
  acquisition_other: string;
  birth_date: string; // yyyy-mm-dd
  country: string | null; // ISO code
  city: string;
  target_countries: string[];
  desired_roles: string[];
  work_styles: string[];
  notifications: Record<string, boolean>;
  notification_permission: 'granted' | 'denied' | 'undecided' | 'unsupported';
  job_search_rating: number | null;
  plan: string;
  tutorial_seen: boolean;
}

export interface OnboardingState {
  version: string;
  startedAt: string | null;
  currentStep: OnboardingStepId;
  steps: Partial<Record<OnboardingStepId, { status: StepStatus; at: string }>>;
  draft: OnboardingDraft;
  completed: boolean;
}

export const createInitialDraft = (): OnboardingDraft => ({
  full_name: '',
  headline: '',
  skills: [],
  experience_years: null,
  education: '',
  resume: {},
  gender: null,
  disability: null,
  acquisition_source: null,
  acquisition_other: '',
  birth_date: '',
  country: null,
  city: '',
  target_countries: [],
  desired_roles: [],
  work_styles: [],
  notifications: { job_matches: true, new_messages: true, application_updates: true, weekly_digest: false },
  notification_permission: 'undecided',
  job_search_rating: null,
  plan: 'seeker-free',
  tutorial_seen: false,
});

export const createInitialState = (): OnboardingState => ({
  version: ONBOARDING_VERSION,
  startedAt: null,
  currentStep: 'welcome',
  steps: {},
  draft: createInitialDraft(),
  completed: false,
});

// ============================================================
// Validation & navigation rules
// ============================================================

export interface StepValidation {
  valid: boolean;
  /** Map of field -> i18n error key */
  errors: Record<string, string>;
}

export function validateStep(id: OnboardingStepId, draft: OnboardingDraft): StepValidation {
  const errors: Record<string, string> = {};
  switch (id) {
    case 'basics':
      if (!draft.full_name || draft.full_name.trim().length < 2) errors.full_name = 'ob_err_name';
      if (draft.skills.length === 0) errors.skills = 'ob_err_skills';
      break;
    case 'birthday': {
      if (!draft.birth_date) { errors.birth_date = 'ob_err_birthday'; break; }
      const age = ageFromBirthDate(draft.birth_date);
      if (age === null || age < 16 || age > 80) errors.birth_date = 'ob_err_age';
      break;
    }
    case 'location':
      if (!draft.country) errors.country = 'ob_err_country';
      if (!draft.city || draft.city.trim().length < 2) errors.city = 'ob_err_city';
      break;
    case 'target_countries':
      if (draft.target_countries.length === 0) errors.target_countries = 'ob_err_target';
      break;
    case 'preferences':
      if (draft.desired_roles.length === 0) errors.desired_roles = 'ob_err_roles';
      if (draft.work_styles.length === 0) errors.work_styles = 'ob_err_work_styles';
      break;
    case 'rating':
      if (draft.job_search_rating === null) errors.rating = 'ob_err_rating';
      break;
    default:
      break; // welcome / resume / review / demographics / notifications / rating / plan / tutorial
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function ageFromBirthDate(iso: string): number | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

/** Ordered step ids for progress + navigation. */
export const STEP_ORDER: OnboardingStepId[] = ONBOARDING_STEPS.map((s) => s.id);

export function nextStepId(id: OnboardingStepId): OnboardingStepId | null {
  const i = STEP_ORDER.indexOf(id);
  return i >= 0 && i < STEP_ORDER.length - 1 ? STEP_ORDER[i + 1] : null;
}

export function prevStepId(id: OnboardingStepId): OnboardingStepId | null {
  const i = STEP_ORDER.indexOf(id);
  return i > 0 ? STEP_ORDER[i - 1] : null;
}

/** First step that is neither done nor skipped — used for resume + deep-link protection. */
export function firstIncompleteStep(state: OnboardingState): OnboardingStepId {
  for (const id of STEP_ORDER) {
    if (!state.steps[id]) return id;
  }
  return 'tutorial';
}

/** Progress 0..100 over all steps except the chromeless welcome screen. */
export function computeProgress(state: OnboardingState): number {
  const measurable = STEP_ORDER.filter((id) => id !== 'welcome');
  const done = measurable.filter((id) => state.steps[id]).length;
  return Math.round((done / measurable.length) * 100);
}

/** Profile strength 0..100 based on canonical profile fields. */
export function computeProfileStrength(draft: OnboardingDraft): { score: number; hints: string[] } {
  let score = 0;
  const hints: string[] = [];
  const add = (ok: boolean, pts: number, hint: string) => {
    if (ok) score += pts; else hints.push(hint);
  };
  add(!!draft.full_name, 15, 'ob_hint_name');
  add(!!draft.headline, 10, 'ob_hint_headline');
  add(draft.skills.length >= 3, 20, 'ob_hint_skills');
  add(!!draft.resume.cvUrl || !!draft.resume.parsed, 15, 'ob_hint_resume');
  add(!!draft.birth_date, 10, 'ob_hint_birthday');
  add(!!draft.country && !!draft.city, 10, 'ob_hint_location');
  add(draft.target_countries.length > 0, 10, 'ob_hint_target');
  add(draft.desired_roles.length > 0, 10, 'ob_hint_roles');
  return { score: Math.min(100, score), hints };
}

// ============================================================
// Resume parsing (client-side, deterministic)
// ============================================================

/**
 * Parse plain-text resume content into structured fields matched against
 * the canonical SKILL_TAXONOMY. PDFs/DOCX are stored and the manual path
 * is used — no fabricated data.
 */
export function parseResumeText(text: string): ResumeExtract {
  const out: ResumeExtract = { parsed: true };
  const clean = text.replace(/\r/g, '');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // Name: first non-empty line that looks like a person name (2-4 words, letters)
  for (const line of lines.slice(0, 6)) {
    if (/^[A-Za-z\u0600-\u06FF][\w\u0600-\u06FF'.-]+( [A-Za-z\u0600-\u06FF][\w\u0600-\u06FF'.-]+){1,3}$/.test(line) && line.length <= 60) {
      out.full_name = line;
      break;
    }
  }
  const emailMatch = clean.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch) out.email = emailMatch[0];
  const phoneMatch = clean.match(/\+?\d[\d\s().-]{7,16}\d/);
  if (phoneMatch) out.phone = phoneMatch[0].replace(/[^\d+]/g, '');

  // Skills: taxonomy matches (case-insensitive, word boundary)
  const lower = clean.toLowerCase();
  const found = SKILL_TAXONOMY.filter((s) => {
    const esc = s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, 'i').test(lower);
  });
  if (found.length) out.skills = found.slice(0, 20);

  // Experience years: "5+ years", "5 years of experience"
  const expMatch = clean.match(/(\d{1,2})\s*\+?\s*years?/i);
  if (expMatch) out.experience_years = Math.min(40, parseInt(expMatch[1], 10));

  // Education keywords
  if (/ph\.?d|doctorate/i.test(clean)) out.education = 'phd';
  else if (/master|m\.?b\.?a|magister/i.test(clean)) out.education = 'master';
  else if (/bachelor|b\.?sc|b\.?a\.?s|b\.?e\.?c|bsc/i.test(clean)) out.education = 'bachelor';
  else if (/diploma|associate/i.test(clean)) out.education = 'diploma';

  // Headline: line after name containing a role keyword
  const roleRe = /(engineer|developer|designer|manager|analyst|scientist|marketer|accountant|consultant|specialist|architect|مهندس|مطور|مصمم|مدير)/i;
  for (const line of lines.slice(0, 10)) {
    if (roleRe.test(line) && line.length <= 80 && line !== out.full_name) {
      out.headline = line;
      break;
    }
  }
  return out;
}

// ============================================================
// Analytics (privacy-conscious: field NAMES only, never values)
// ============================================================

export type OnboardingEventName =
  | 'onboarding_started' | 'onboarding_resumed' | 'step_completed' | 'step_skipped'
  | 'signup_oauth_tapped' | 'signup_otp_sent' | 'signup_otp_verified'
  | 'resume_uploaded' | 'resume_parsed' | 'location_permission'
  | 'notification_permission' | 'plan_selected' | 'onboarding_completed';

export async function trackOnboarding(
  userId: string,
  event: OnboardingEventName,
  stepId?: OnboardingStepId | 'signup',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await apiClient.query('trackOnboarding', () =>
      apiClient.supabase.from('onboarding_events').insert({
        user_id: userId,
        event_name: event,
        step_id: stepId ?? null,
        group_id: stepId && stepId !== 'signup' ? getStepDef(stepId).group : null,
        metadata,
      })
    );
  } catch (err) {
    logger.warn('[Onboarding] analytics insert failed', err); // never block the journey
  }
}

// ============================================================
// Server <-> state serialization
// ============================================================

function sanitizeServerState(raw: any): OnboardingState | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    const base = createInitialState();
    const state: OnboardingState = {
      ...base,
      version: typeof raw.version === 'string' ? raw.version : base.version,
      startedAt: raw.startedAt ?? null,
      currentStep: STEP_ORDER.includes(raw.currentStep) ? raw.currentStep : base.currentStep,
      steps: raw.steps && typeof raw.steps === 'object' ? raw.steps : {},
      draft: { ...base.draft, ...(raw.draft || {}) },
      completed: !!raw.completed,
    };
    return state;
  } catch {
    return null;
  }
}

// ============================================================
// Zustand store — resumable onboarding state
// ============================================================

interface OnboardingStore {
  userId: string | null;
  state: OnboardingState;
  hydrated: boolean;
  syncing: boolean;
  /** Merge partial draft fields. */
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
  setStep: (id: OnboardingStepId) => void;
  /** Load authoritative state from user_profiles.onboarding_state (server wins). */
  hydrate: (userId: string) => Promise<OnboardingState>;
  /** Persist current state to the server (fire-and-forget safe). */
  sync: () => Promise<void>;
  /** Mark a step done/skipped, persist profile fields, advance, sync. */
  completeStep: (userId: string, id: OnboardingStepId, status: StepStatus) => Promise<void>;
  reset: () => void;
}

/** Map draft fields -> job_seeker_profiles columns (canonical persistence). */
function draftToProfileColumns(draft: OnboardingDraft): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  if (draft.full_name) cols.full_name = draft.full_name.trim();
  if (draft.headline) cols.headline = draft.headline.trim();
  if (draft.skills.length) cols.skills = draft.skills;
  if (draft.experience_years !== null) cols.experience_years = draft.experience_years;
  if (draft.education) cols.education = draft.education;
  if (draft.gender) cols.gender = draft.gender;
  if (draft.disability) cols.disability = draft.disability;
  if (draft.acquisition_source) cols.acquisition_source = draft.acquisition_source;
  if (draft.acquisition_other) cols.acquisition_other = draft.acquisition_other;
  if (draft.birth_date) cols.date_of_birth = draft.birth_date;
  if (draft.country) cols.country = draft.country;
  if (draft.city) cols.city = draft.city;
  if (draft.target_countries.length) cols.target_countries = draft.target_countries;
  if (draft.desired_roles.length) cols.desired_roles = draft.desired_roles;
  if (draft.work_styles.length) cols.work_styles = draft.work_styles;
  if (draft.resume.cvUrl) cols.cv_url = draft.resume.cvUrl;
  if (Object.keys(draft.resume).length) cols.resume_extract = draft.resume;
  cols.job_preferences = {
    desired_roles: draft.desired_roles,
    work_styles: draft.work_styles,
    job_search_rating: draft.job_search_rating,
    notifications: draft.notifications,
    notification_permission: draft.notification_permission,
  };
  cols.notification_enabled = Object.values(draft.notifications).some(Boolean) && draft.notification_permission === 'granted';
  return cols;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      userId: null,
      state: createInitialState(),
      hydrated: false,
      syncing: false,

      patchDraft: (patch) =>
        set((s) => ({ state: { ...s.state, draft: { ...s.state.draft, ...patch } } })),

      setStep: (id) =>
        set((s) => ({ state: { ...s.state, currentStep: id } })),

      hydrate: async (userId: string) => {
        const local = get().state;
        // Load server state; fall back to the local persisted mirror when offline.
        //
        // BOUNDED BY DESIGN: `hydrated` is the single gate for the onboarding
        // page's full-screen spinner, so this promise MUST settle in every
        // outcome. An unbounded profile read previously left `hydrated` false
        // forever, which is precisely the reported infinite signup spinner.
        // On timeout the local mirror is kept and the journey continues.
        const { data } = await withTimeout(
          profileService.getUserProfile(userId),
          BOOTSTRAP_TIMEOUT_MS,
          { data: null, error: null } as any
        );
        try {
          const server = sanitizeServerState((data as any)?.onboarding_state);
          let next = server ?? local;
          // Server version mismatch -> keep server step statuses but refresh draft shape.
          if (server && server.version !== ONBOARDING_VERSION) {
            next = { ...server, version: ONBOARDING_VERSION };
          }
          // Resume at first incomplete step unless already completed.
          if (!next.completed) {
            next = { ...next, currentStep: firstIncompleteStep(next) };
          }
          set({ userId, state: next, hydrated: true });
          return next;
        } catch (err) {
          // Malformed persisted or server state must still release the spinner.
          logger.warn('[Onboarding] hydrate failed; continuing with local mirror', err);
          const fallback = local ?? createInitialState();
          set({ userId, state: fallback, hydrated: true });
          return fallback;
        }
      },

      sync: async () => {
        const { userId, state, syncing } = get();
        if (!userId || syncing) return;
        set({ syncing: true });
        try {
          await apiClient.query('saveOnboardingState', () =>
            apiClient.supabase
              .from('user_profiles')
              .update({ onboarding_state: state })
              .eq('user_id', userId)
          );
        } catch (err) {
          logger.warn('[Onboarding] server sync failed (local mirror kept)', err);
        } finally {
          set({ syncing: false });
        }
      },

      completeStep: async (userId: string, id: OnboardingStepId, status: StepStatus) => {
        const { state, sync } = get();
        const now = new Date().toISOString();
        const updated: OnboardingState = {
          ...state,
          startedAt: state.startedAt ?? now,
          steps: { ...state.steps, [id]: { status, at: now } },
        };
        // Advance to the next incomplete step (or stay on last).
        if (status === 'done') {
          const nxt = nextStepId(id);
          updated.currentStep = nxt ?? id;
        } else {
          const nxt = nextStepId(id);
          updated.currentStep = nxt ?? id;
        }
        set({ state: updated });

        // Persist canonical profile fields for this step's data.
        const cols = draftToProfileColumns(updated.draft);
        if (Object.keys(cols).length) {
          await profileService.upsertSeekerProfile(userId, cols);
        }
        trackOnboarding(userId, status === 'done' ? 'step_completed' : 'step_skipped', id, {
          fields: Object.keys(cols), // names only — never values
        });
        await sync();
      },

      reset: () => set({ userId: null, state: createInitialState(), hydrated: false }),
    }),
    {
      name: 'matchme-onboarding',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ userId: s.userId, state: s.state }),
    }
  )
);

// ============================================================
// Completion (idempotent free credits + canonical onboarding flag)
// ============================================================

export async function finalizeOnboarding(userId: string): Promise<void> {
  const { state, sync, patchDraft } = useOnboardingStore.getState();
  const plan = state.draft.plan || 'seeker-free';
  patchDraft({ plan });

  // Idempotent signup credits: only grant once, guarded by the column value.
  const { data: existing } = await profileService.getSeekerProfile(userId);
  const alreadyGranted = (existing as any)?.signup_credits != null && (existing as any).signup_credits > 0;
  await profileService.upsertSeekerProfile(userId, {
    ...draftToProfileColumns(state.draft),
    plan,
    onboarding_version: ONBOARDING_VERSION,
    ...(alreadyGranted ? {} : { signup_credits: 50 }),
  });

  await profileService.completeOnboarding(userId);
  useOnboardingStore.setState((s) => ({ state: { ...s.state, completed: true } }));
  await sync();
  trackOnboarding(userId, 'onboarding_completed', 'tutorial', { plan, credits_granted: !alreadyGranted });
}

// ============================================================
// Location helpers (offline geolocation -> nearest country centroid)
// ============================================================

export function nearestCountry(lat: number, lng: number): CountryOption {
  let best = COUNTRIES[0];
  let bestD = Infinity;
  for (const c of COUNTRIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

export function requestGeolocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (!settled) { settled = true; clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); } },
      () => { if (!settled) { settled = true; clearTimeout(timer); resolve(null); } },
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}
