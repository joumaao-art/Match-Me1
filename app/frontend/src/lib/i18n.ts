/**
 * i18n configuration for the web application.
 * Uses translations from @matchme/shared package.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, ar } from '@matchme/shared/i18n';

const savedLang = localStorage.getItem('matchme-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('matchme-lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

export default i18n;