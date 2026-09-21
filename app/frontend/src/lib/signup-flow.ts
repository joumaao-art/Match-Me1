/**
 * Post-authentication identity bootstrap & routing
 * ============================================================
 * Single orchestration layer shared by EVERY Job Seeker signup method
 * (email, Apple, Google, phone OTP), by login, and by the OAuth/phone
 * callback. Keeping the decision in one place is what stops the signup
 * methods from disagreeing about where a freshly authenticated user lands.
 *
 * Invariants enforced here:
 *  1. Identity bootstrap is idempotent — a retry, a duplicate callback or a
 *     returning user never produces a duplicate-key failure.
 *  2. Every network step is time-boxed, so a slow or unreachable profile read
 *     can never leave the UI stuck on a loading screen.
 *  3. A Job Seeker who has not finished onboarding always lands on
 *     /seeker/onboarding (the "Welcome to MatchMe" screen); a completed Job
 *     Seeker lands on /seeker.
 *  4. Company and admin routing is untouched.
 *
 * Company onboarding and Company authentication are intentionally NOT
 * affected by this module.
 */

import { authService, profileService } from '@/services';
import { ROUTES } from '@/config/constants';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/types';

/** Hard ceiling for any single bootstrap/profile step (ms). */
export const BOOTSTRAP_TIMEOUT_MS = 8000;

/** Hard ceiling for reading the local session (ms). */
export const SESSION_TIMEOUT_MS = 5000;

/**
 * Resolve a promise, but never wait longer than `ms`.
 * A rejection or a timeout both yield `fallback`, so callers can treat the
 * result as always-present and stay free of hanging awaits.
 */
export function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Read the identity of the current session, with a bounded wait.
 * Used as a safety net whenever the auth store has not been populated yet
 * (for example a race right after signup).
 */
export async function getSessionIdentity(): Promise<{
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
}> {
  const empty = { userId: null, email: null, emailVerified: false };
  const result = await withTimeout(authService.getSession(), SESSION_TIMEOUT_MS, null);
  const session = (result as any)?.data?.session;
  const user = session?.user;
  if (!user?.id) return empty;
  return {
    userId: user.id as string,
    email: (user.email as string) ?? null,
    emailVerified: !!user.email_confirmed_at,
  };
}

/**
 * Ensure the base profile and the role profile exist.
 *
 * Idempotent by design (see auth.service): both writers target
 * `onConflict: 'user_id'` and ignore duplicates, so an existing profile is
 * preserved and a retry is harmless. Never throws — the caller always gets a
 * result it can log or surface.
 */
export async function ensureIdentity(
  userId: string,
  email: string | null,
  role: UserRole = 'job_seeker'
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  const base = await withTimeout(
    authService.createUserProfile(userId, role),
    BOOTSTRAP_TIMEOUT_MS,
    null
  );
  if ((base as any)?.error) errors.push(`user_profile: ${(base as any).error.message}`);

  const roleProfile = await withTimeout(
    authService.createRoleProfile(userId, role, email || ''),
    BOOTSTRAP_TIMEOUT_MS,
    null
  );
  if ((roleProfile as any)?.error) errors.push(`role_profile: ${(roleProfile as any).error.message}`);

  if (errors.length) logger.warn('[SignupFlow] Identity bootstrap reported issues', errors);
  return { ok: errors.length === 0, errors };
}

/**
 * Has this Job Seeker finished onboarding?
 *
 * Also handles accounts that predate the onboarding flag: a profile that
 * already carries real data (name + skills) is back-filled as completed so an
 * established user is never pushed back into the journey.
 */
export async function isSeekerOnboardingComplete(userId: string): Promise<boolean> {
  const [base, seeker] = await Promise.all([
    withTimeout(profileService.getUserProfile(userId), BOOTSTRAP_TIMEOUT_MS, null),
    withTimeout(profileService.getSeekerProfile(userId), BOOTSTRAP_TIMEOUT_MS, null),
  ]);

  if ((base as any)?.data?.onboarding_completed) return true;

  const profile = (seeker as any)?.data;
  const hasRealData =
    !!profile?.full_name &&
    String(profile.full_name).trim().length >= 2 &&
    (profile?.skills?.length ?? 0) > 0;

  if (hasRealData) {
    await withTimeout(profileService.completeOnboarding(userId), BOOTSTRAP_TIMEOUT_MS, null);
    return true;
  }

  return false;
}

/**
 * Where should an authenticated user land?
 *
 * Job Seekers are routed by onboarding state. If the completion state cannot
 * be determined, we send them to onboarding on purpose: that page redirects
 * completed users onward to /seeker by itself, so this default is always
 * self-correcting and never traps anybody.
 */
export async function resolvePostAuthDestination(
  role: UserRole | null,
  userId: string | null
): Promise<string> {
  if (role === 'admin') return ROUTES.ADMIN_DASHBOARD;
  if (role === 'company') return ROUTES.COMPANY;
  if (role !== 'job_seeker') return ROUTES.AUTH;
  if (!userId) return ROUTES.SEEKER_ONBOARDING;

  try {
    const completed = await isSeekerOnboardingComplete(userId);
    return completed ? ROUTES.SEEKER : ROUTES.SEEKER_ONBOARDING;
  } catch (err) {
    logger.warn('[SignupFlow] Completion lookup failed; defaulting to onboarding', err);
    return ROUTES.SEEKER_ONBOARDING;
  }
}

/**
 * Complete signup for a Job Seeker: bootstrap the identity, then resolve the
 * destination. Intended to be awaited by the signup handlers before they
 * navigate, so the app never renders a route it cannot satisfy.
 */
export async function completeSeekerSignup(
  userId: string,
  email: string | null
): Promise<{ destination: string; ok: boolean }> {
  const identity = await ensureIdentity(userId, email, 'job_seeker');
  const destination = await resolvePostAuthDestination('job_seeker', userId);
  return { destination, ok: identity.ok };
}

/**
 * Bounded budget for the whole post-signup settle (identity bootstrap +
 * destination resolution). Deliberately ONE deadline rather than a sum of
 * per-step timeouts, so the submit button is released within a predictable
 * window no matter how many internal steps run.
 */
export const SIGNUP_SETTLE_TIMEOUT_MS = 12000;

/** The three — and only three — ways an email signup can end. */
export type SignupOutcome = 'authenticated' | 'verification_required' | 'error';

export interface SignupClassification {
  outcome: SignupOutcome;
  userId: string | null;
  email: string | null;
  /** True when Supabase reported no new identity (address already registered). */
  alreadyRegistered: boolean;
  message: string | null;
}

/**
 * Classify the result of `authService.signUp` into a typed, exhaustive outcome.
 *
 * THE INVARIANT: the SESSION decides the outcome — never `email_confirmed_at`.
 *
 * Why this matters (the reported "signup hangs forever" defect): a project can
 * return a fully confirmed `user` while issuing NO session (email confirmation
 * enabled with an auto-confirmed user is the exact case observed here). Judging
 * by the confirmation timestamp classified that response as "signed in", and
 * the caller then ran authenticated profile writes — with no access token. Those
 * writes never produce a usable result, so the submit button stayed busy while
 * nothing moved on screen: an indefinite post-submission hang.
 *
 * With this classifier a missing session ALWAYS means "verification required",
 * so the caller can route to the verification screen and skip authenticated
 * writes entirely.
 */
export function classifySignupOutcome(data: any, error: any): SignupClassification {
  if (error) {
    return {
      outcome: 'error',
      userId: null,
      email: null,
      alreadyRegistered: false,
      message: error.message || 'Registration failed',
    };
  }

  const user = data?.user;
  if (!user?.id) {
    return {
      outcome: 'error',
      userId: null,
      email: null,
      alreadyRegistered: false,
      message: 'Registration failed',
    };
  }

  const session = data?.session ?? null;
  const hasSession = !!session?.access_token || !!session?.user?.id;
  const identities = Array.isArray(user.identities) ? user.identities : null;

  if (hasSession) {
    return {
      outcome: 'authenticated',
      userId: user.id as string,
      email: (user.email as string) ?? null,
      alreadyRegistered: false,
      message: null,
    };
  }

  return {
    outcome: 'verification_required',
    userId: user.id as string,
    email: (user.email as string) ?? null,
    // Supabase answers an already-registered address with an empty identity
    // list and no error (deliberate anti-enumeration), which must NOT be
    // mistaken for a fresh account.
    alreadyRegistered: identities !== null && identities.length === 0,
    message: null,
  };
}

/**
 * Settle a Job Seeker signup that holds a real session: bootstrap the identity,
 * then resolve the destination — all inside ONE deadline.
 *
 * The caller is guaranteed to receive a usable destination, so the submit
 * button can never remain busy. The onboarding page self-redirects finished
 * seekers onward, which makes the fallback self-correcting rather than a trap.
 */
export async function settleSeekerSignup(
  userId: string,
  email: string | null
): Promise<{ destination: string; ok: boolean }> {
  const fallback = { destination: ROUTES.SEEKER_ONBOARDING, ok: false };
  return withTimeout(
    completeSeekerSignup(userId, email),
    SIGNUP_SETTLE_TIMEOUT_MS,
    fallback
  );
}
