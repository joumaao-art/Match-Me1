/**
 * Authentication service for the mobile app.
 */

import { apiClient } from './api-client';
import { logger } from '../lib/logger';
import type { LoginCredentials, RegisterCredentials } from '../types';

class AuthService {
  async signIn({ email, password }: LoginCredentials) {
    logger.info('[AuthService] Signing in user');
    return apiClient.query('signIn', () =>
      apiClient.auth.signInWithPassword({ email, password }) as any
    );
  }

  async signUp({ email, password }: RegisterCredentials) {
    logger.info('[AuthService] Registering new user');
    return apiClient.query('signUp', () =>
      apiClient.auth.signUp({ email, password }) as any
    );
  }

  async signOut() {
    logger.info('[AuthService] Signing out user');
    const { error } = await apiClient.auth.signOut();
    return { data: null, error: error ? { message: error.message, code: error.name } : null };
  }

  async resetPassword(email: string) {
    logger.info('[AuthService] Sending password reset email');
    return apiClient.query('resetPassword', () =>
      apiClient.auth.resetPasswordForEmail(email) as any
    );
  }

  async getSession() {
    return apiClient.query('getSession', () =>
      apiClient.auth.getSession() as any
    );
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return apiClient.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
export default authService;