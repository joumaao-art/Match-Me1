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
    return apiClient.query('signOut', () => apiClient.auth.signOut());
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
    logger.info('[AuthService] Creating user profile', { role });
    return apiClient.query('createUserProfile', () =>
      apiClient.supabase.from('user_profiles').insert({
        user_id: userId,
        role,
        display_name: displayName,
        onboarding_completed: false,
      }).select().single()
    );
  }

  /**
   * Create role-specific profile (seeker or company).
   */
  async createRoleProfile(userId: string, role: UserRole, email: string) {
    if (role === 'job_seeker') {
      return apiClient.query('createSeekerProfile', () =>
        apiClient.supabase.from('job_seeker_profiles').insert({
          user_id: userId,
          email,
        }).select().single()
      );
    } else if (role === 'company') {
      return apiClient.query('createCompanyProfile', () =>
        apiClient.supabase.from('company_profiles').insert({
          user_id: userId,
        }).select().single()
      );
    }
    return { data: null, error: null };
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