/**
 * Auth store - global authentication state management.
 * Manages user session, role, and auth state with persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';
import { authService } from '@/services/auth.service';
import { logger } from '@/lib/logger';

interface AuthStore {
  // State
  userId: string | null;
  email: string | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  rememberMe: boolean;
  sessionExpiresAt: number | null;

  // Actions
  setUser: (userId: string, email: string, emailVerified?: boolean) => void;
  setUserRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  setRememberMe: (remember: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  fetchAndSetRole: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  userId: null,
  email: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: true,
  isEmailVerified: false,
  rememberMe: false,
  sessionExpiresAt: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (userId, email, emailVerified = false) => {
        set({
          userRole: get().userId === userId ? get().userRole : null,
          userId,
          email,
          isAuthenticated: true,
          isLoading: false,
          isEmailVerified: emailVerified,
        });
      },

      setUserRole: (role) => {
        set({ userRole: role });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setRememberMe: (remember) => {
        set({ rememberMe: remember });
      },

      setEmailVerified: (verified) => {
        set({ isEmailVerified: verified });
      },

      /**
       * Fetch user role from database and update store.
       */
      fetchAndSetRole: async (userId: string) => {
        try {
          const role = await authService.getUserRole(userId);
          if (get().userId === userId) {
            set({ userRole: role });
            logger.info('[AuthStore] Role fetched from DB:', role);
          }
        } catch (err) {
          logger.error('[AuthStore] Failed to fetch role:', err);
        }
      },

      signOut: async () => {
        logger.info('[AuthStore] Signing out');
        await authService.signOut();
        set({ ...initialState, isLoading: false });
        // Clear session storage as well
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      },

      reset: () => {
        set({ ...initialState, isLoading: false });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      storage: createJSONStorage(() => {
        // Use localStorage for "remember me", sessionStorage otherwise
        // We check the stored value to determine which to use
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.state?.rememberMe) return localStorage;
          } catch { /* ignore */ }
        }
        return localStorage; // Default to localStorage for persistence
      }),
      partialize: (state) => ({
        userRole: state.userRole,
        userId: state.userId,
        email: state.email,
        rememberMe: state.rememberMe,
        isEmailVerified: state.isEmailVerified,
      }),
    }
  )
);