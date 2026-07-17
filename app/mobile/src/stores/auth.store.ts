/**
 * Auth store for the mobile app using Zustand.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import { logger } from '../lib/logger';
import type { UserRole } from '../types';
import { STORAGE_KEYS } from '../config/constants';

interface AuthStore {
  userId: string | null;
  email: string | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;

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
        set({ ...initialState, isLoading: false });
      },

      reset: () => {
        set({ ...initialState, isLoading: false });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userRole: state.userRole,
        userId: state.userId,
        email: state.email,
      }),
    }
  )
);