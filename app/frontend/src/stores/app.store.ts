/**
 * App store - global application settings (theme, language, UI state).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/constants';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ar';

interface AppStore {
  // State
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      sidebarOpen: false,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },

      setLanguage: (language) => {
        set({ language });
        applyLanguage(language);
      },

      toggleLanguage: () => {
        const current = get().language;
        const next = current === 'en' ? 'ar' : 'en';
        set({ language: next });
        applyLanguage(next);
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: STORAGE_KEYS.THEME,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// Side effects
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function applyLanguage(language: Language) {
  const root = document.documentElement;
  root.dir = language === 'ar' ? 'rtl' : 'ltr';
  root.lang = language;
}