/**
 * Auth store - global authentication state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';
import { authService } from '@/services';
import { logger } from '@/lib/logger';

interface AuthStore {
  // State
  userId: string | null;
  email: string | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (userId: string, email: string) => void;
  setUserRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  userId: null,
  email: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (userId, email) => {
        set({ userId, email, isAuthenticated: true, isLoading: false });
      },

      setUserRole: (role) => {
        set({ userRole: role });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      signOut: async () => {
        logger.info('[AuthStore] Signing out');
        await authService.signOut();
        set(initialState);
        set({ isLoading: false });
      },

      reset: () => {
        set(initialState);
        set({ isLoading: false });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      partialize: (state) => ({
        userRole: state.userRole,
        userId: state.userId,
        email: state.email,
      }),
    }
  )
);