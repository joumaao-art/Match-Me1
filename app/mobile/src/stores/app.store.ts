/**
 * App store for the mobile app - theme, language, UI state.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ar';

interface AppStore {
  theme: Theme;
  language: Language;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        set({ theme: current === 'dark' ? 'light' : 'dark' });
      },

      setLanguage: (language) => set({ language }),
      toggleLanguage: () => {
        const current = get().language;
        set({ language: current === 'en' ? 'ar' : 'en' });
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);