/**
 * Authentication service - handles all auth-related operations.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { LoginCredentials, RegisterCredentials, UserRole } from '@/types';

class AuthService {
  async signIn({ email, password }: LoginCredentials) {
    logger.info('[AuthService] Signing in user');
    return apiClient.query('signIn', () =>
      apiClient.auth.signInWithPassword({ email, password })
    );
  }

  async signUp({ email, password }: RegisterCredentials) {
    logger.info('[AuthService] Registering new user');
    return apiClient.query('signUp', () =>
      apiClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
    );
  }

  async signOut() {
    logger.info('[AuthService] Signing out user');
    return apiClient.query('signOut', () => apiClient.auth.signOut());
  }

  async resetPassword(email: string) {
    logger.info('[AuthService] Sending password reset email');
    return apiClient.query('resetPassword', () =>
      apiClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
    );
  }

  async getSession() {
    return apiClient.query('getSession', () => apiClient.auth.getSession());
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return apiClient.auth.onAuthStateChange(callback);
  }

  async updateProfile(userId: string, role: UserRole, profileData: Record<string, any>) {
    const table = role === 'company' ? 'company_profiles' : 'job_seeker_profiles';
    return apiClient.query('updateProfile', () =>
      apiClient.supabase.from(table).upsert({ user_id: userId, ...profileData }).select().single()
    );
  }
}

export const authService = new AuthService();
export default authService;