/**
 * Authentication service - handles all auth-related operations.
 * Uses Supabase Auth with role-based access control.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { LoginCredentials, RegisterCredentials, UserRole } from '@/types';

class AuthService {
  /**
   * Sign in with email and password.
   * Supports "remember me" via session persistence.
   */
  async signIn({ email, password }: LoginCredentials) {
    logger.info('[AuthService] Signing in user');
    return apiClient.query('signIn', () =>
      apiClient.auth.signInWithPassword({ email, password })
    );
  }

  /**
   * Sign up a new user with email and password.
   * Sends email verification automatically via Supabase.
   */
  async signUp({ email, password, role }: RegisterCredentials) {
    logger.info('[AuthService] Registering new user', { role });
    return apiClient.query('signUp', () =>
      apiClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role }, // Store role in user metadata
        },
      })
    );
  }

  /**
   * Sign out the current user and clear session.
   */
  async signOut() {
    logger.info('[AuthService] Signing out user');
    return apiClient.query('signOut', async () => ({ data: null, ...(await apiClient.auth.signOut()) }));
  }

  /**
   * Send password reset email.
   */
  async resetPassword(email: string) {
    logger.info('[AuthService] Sending password reset email');
    return apiClient.query('resetPassword', () =>
      apiClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
    );
  }

  /**
   * Update password (used after reset link click).
   */
  async updatePassword(newPassword: string) {
    logger.info('[AuthService] Updating password');
    return apiClient.query('updatePassword', () =>
      apiClient.auth.updateUser({ password: newPassword })
    );
  }

  /**
   * Resend email verification.
   */
  async resendVerification(email: string) {
    logger.info('[AuthService] Resending verification email');
    return apiClient.query('resendVerification', () =>
      apiClient.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    );
  }

  /**
   * Get current session.
   */
  async getSession() {
    return apiClient.query('getSession', () => apiClient.auth.getSession());
  }

  /**
   * Get current user.
   */
  async getUser() {
    return apiClient.query('getUser', () => apiClient.auth.getUser());
  }

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return apiClient.auth.onAuthStateChange(callback);
  }

  /**
   * Get user role from database.
   * Checks admin_users table first, then user_profiles.
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    logger.info('[AuthService] Fetching user role from database');

    // Check admin table first
    const { data: adminData } = await apiClient.query<any>('checkAdmin', () =>
      apiClient.supabase
        .from('admin_users')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
    );

    if (adminData) {
      return 'admin';
    }

    // Check user_profiles
    const { data: profileData } = await apiClient.query<any>('getUserRole', () =>
      apiClient.supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()
    );

    return profileData?.role || null;
  }

  /**
   * Create user profile after registration.
   * Sets up the role in the database.
   */
  async createUserProfile(userId: string, role: UserRole, displayName?: string) {
    logger.info('[AuthService] Ensuring user profile', { role });
    // Idempotent: targets the `user_id` unique constraint and ignores a
    // duplicate, so a retry (or a second caller such as the OAuth callback)
    // can never fail with 23505 — the reason signup previously stalled.
    return apiClient.query('createUserProfile', () =>
      apiClient.supabase
        .from('user_profiles')
        .upsert(
          { user_id: userId, role, display_name: displayName },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle()
    );
  }

  /**
   * Create role-specific profile (seeker or company).
   */
  async createRoleProfile(userId: string, role: UserRole, email: string) {
    // Same idempotency contract as createUserProfile: conflict-safe writes on
    // `user_id`, duplicate rows ignored so an existing profile is preserved.
    if (role === 'job_seeker') {
      return apiClient.query('createSeekerProfile', () =>
        apiClient.supabase
          .from('job_seeker_profiles')
          .upsert(
            { user_id: userId, email },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
          .select()
          .maybeSingle()
      );
    } else if (role === 'company') {
      return apiClient.query('createCompanyProfile', () =>
        apiClient.supabase
          .from('company_profiles')
          .upsert(
            { user_id: userId },
            { onConflict: 'user_id', ignoreDuplicates: true }
          )
          .select()
          .maybeSingle()
      );
    }
    return { data: null, error: null };
  }

  /**
   * OAuth sign-in (Apple / Google). Redirects to the provider and returns
   * to /auth/callback. Used only by the Job Seeker signup path.
   */
  async signInWithOAuth(provider: 'apple' | 'google') {
    logger.info('[AuthService] OAuth sign-in', { provider });
    return apiClient.query(`oauth_${provider}`, () =>
      apiClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    );
  }

  /**
   * Send an SMS OTP to a phone number (E.164). Creates the user if absent.
   */
  async sendPhoneOtp(phone: string) {
    logger.info('[AuthService] Sending phone OTP');
    return apiClient.query('sendPhoneOtp', () =>
      apiClient.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } })
    );
  }

  /**
   * Verify an SMS OTP code and establish the session.
   */
  async verifyPhoneOtp(phone: string, token: string) {
    logger.info('[AuthService] Verifying phone OTP');
    return apiClient.query('verifyPhoneOtp', () =>
      apiClient.auth.verifyOtp({ phone, token, type: 'sms' })
    );
  }

  /**
   * Normalize a raw phone input to E.164 using the selected dial code.
   * Strips spaces/dashes/parens; drops a leading local 0 when dial code given.
   */
  normalizePhone(raw: string, dialCode: string): string | null {
    const digits = raw.replace(/[^\d]/g, '');
    const dial = dialCode.replace(/[^\d]/g, '');
    if (!dial || !digits) return null;
    const local = digits.startsWith('00') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    if (local.length < 6) return null;
    return `+${dial}${local}`;
  }

  /**
   * Admin login - same as regular login but verifies admin status.
   */
  async adminSignIn({ email, password }: LoginCredentials) {
    logger.info('[AuthService] Admin sign in attempt');

    const result = await this.signIn({ email, password });
    if (result.error || !result.data) {
      return result;
    }

    const session = (result.data as any)?.session;
    const user = session?.user || (result.data as any)?.user;

    if (!user?.id) {
      return { data: null, error: { message: 'Authentication failed', code: 'AUTH_FAILED' } };
    }

    // Verify admin status
    const { data: adminData } = await apiClient.query<any>('verifyAdmin', () =>
      apiClient.supabase
        .from('admin_users')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
    );

    if (!adminData) {
      // Not an admin - sign them out
      await this.signOut();
      return {
        data: null,
        error: { message: 'Access denied. This login is for administrators only.', code: 'NOT_ADMIN' },
      };
    }

    // Update last login
    await apiClient.supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return result;
  }

  /**
   * Check if email is verified.
   */
  isEmailVerified(user: any): boolean {
    return !!user?.email_confirmed_at;
  }
}

export const authService = new AuthService();
export default authService;