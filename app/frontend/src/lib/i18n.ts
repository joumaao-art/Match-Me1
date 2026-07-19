/**
 * i18n configuration for the web application.
 * Uses translations from @matchme/shared package.
 * 
 * Features:
 * - Robust fallback: Never displays raw translation keys to end users
 * - Missing key detection: Logs warnings in development
 * - Missing key recording: Tracks missing keys for the Localization Management module
 * - Performance: Caching, minimal re-renders
 * - Future-ready: Easy to add new languages without architectural changes
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, ar } from '@matchme/shared/i18n';

// ============================================================
// Missing Translation Tracker
// ============================================================

interface MissingKeyEntry {
  key: string;
  language: string;
  timestamp: number;
  context?: string;
}

class MissingTranslationTracker {
  private missingKeys: Map<string, MissingKeyEntry> = new Map();
  private static instance: MissingTranslationTracker;

  static getInstance(): MissingTranslationTracker {
    if (!MissingTranslationTracker.instance) {
      MissingTranslationTracker.instance = new MissingTranslationTracker();
    }
    return MissingTranslationTracker.instance;
  }

  record(key: string, language: string): void {
    const entryKey = `${language}:${key}`;
    if (!this.missingKeys.has(entryKey)) {
      this.missingKeys.set(entryKey, {
        key,
        language,
        timestamp: Date.now(),
      });
      // Log in development only
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation: "${key}" for language "${language}"`);
      }
    }
  }

  getMissingKeys(): MissingKeyEntry[] {
    return Array.from(this.missingKeys.values());
  }

  getMissingKeysForLanguage(language: string): MissingKeyEntry[] {
    return this.getMissingKeys().filter(entry => entry.language === language);
  }

  getCount(): number {
    return this.missingKeys.size;
  }

  clear(): void {
    this.missingKeys.clear();
  }
}

export const missingTranslationTracker = MissingTranslationTracker.getInstance();

// ============================================================
// Key-to-Human-Readable Fallback
// ============================================================

/**
 * Converts a translation key like "ai_recommendations_desc" into
 * a human-readable fallback: "AI Recommendations Desc"
 * This ensures end users NEVER see raw underscore-separated keys.
 */
function keyToHumanReadable(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bUi\b/g, 'UI')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bRls\b/g, 'RLS')
    .replace(/\bJwt\b/g, 'JWT')
    .replace(/\bSms\b/g, 'SMS')
    .replace(/\bCsv\b/g, 'CSV')
    .replace(/\bPdf\b/g, 'PDF')
    .replace(/\bXlsx\b/g, 'XLSX')
    .replace(/\bRtl\b/g, 'RTL')
    .replace(/\bLtr\b/g, 'LTR')
    .replace(/\bDesc\b/g, '')
    .trim();
}

// ============================================================
// i18n Initialization
// ============================================================

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
  // Return empty string for missing keys so we can handle them in parseMissingKeyHandler
  returnNull: false,
  returnEmptyString: false,
  // Custom missing key handler
  missingKeyHandler: (_lngs, _ns, key, fallbackValue) => {
    missingTranslationTracker.record(key, i18n.language);
    return fallbackValue || keyToHumanReadable(key);
  },
  // Use the key transformation as fallback value
  parseMissingKeyHandler: (key: string) => {
    // Check if the English translation exists as ultimate fallback
    const enValue = (en as Record<string, string>)[key];
    if (enValue) {
      return enValue;
    }
    // Convert key to human-readable format - NEVER show raw keys
    return keyToHumanReadable(key);
  },
  // Suppress console errors for missing keys (we handle them ourselves)
  saveMissing: false,
});

// Set initial direction and lang on page load
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('matchme-lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// ============================================================
// Supported Languages Registry
// ============================================================

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  status: 'production' | 'beta' | 'draft';
  completionPercentage: number;
}

export const supportedLanguages: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', status: 'production', completionPercentage: 100 },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', status: 'production', completionPercentage: 100 },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', status: 'draft', completionPercentage: 0 },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', status: 'draft', completionPercentage: 0 },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', status: 'draft', completionPercentage: 0 },
];

// ============================================================
// Translation Utilities
// ============================================================

/**
 * Get all translation keys from the English (source) translations
 */
export function getAllTranslationKeys(): string[] {
  return Object.keys(en);
}

/**
 * Get translation completeness for a given language
 */
export function getTranslationCompleteness(langCode: string): { total: number; translated: number; missing: number; percentage: number } {
  const allKeys = getAllTranslationKeys();
  const total = allKeys.length;
  
  if (langCode === 'en') {
    return { total, translated: total, missing: 0, percentage: 100 };
  }
  
  const langTranslations = i18n.getResourceBundle(langCode, 'translation') || {};
  const translated = Object.keys(langTranslations).length;
  const missing = total - translated;
  const percentage = Math.round((translated / total) * 100);
  
  return { total, translated, missing, percentage };
}

/**
 * Validate translations for common issues
 */
export function validateTranslations(langCode: string): { duplicates: string[]; interpolationMismatches: string[]; emptyValues: string[] } {
  const translations = i18n.getResourceBundle(langCode, 'translation') || {};
  const duplicates: string[] = [];
  const interpolationMismatches: string[] = [];
  const emptyValues: string[] = [];
  
  const enTranslations = en as Record<string, string>;
  
  Object.entries(translations).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    
    // Check empty values
    if (!value.trim()) {
      emptyValues.push(key);
    }
    
    // Check interpolation parameter mismatches
    const enValue = enTranslations[key];
    if (enValue) {
      const enParams = enValue.match(/\{\{(\w+)\}\}/g) || [];
      const langParams = value.match(/\{\{(\w+)\}\}/g) || [];
      if (enParams.length !== langParams.length) {
        interpolationMismatches.push(key);
      }
    }
  });
  
  // Check for duplicate values (different keys with same value - potential copy-paste errors)
  const valueMap = new Map<string, string[]>();
  Object.entries(translations).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    const existing = valueMap.get(value) || [];
    existing.push(key);
    valueMap.set(value, existing);
  });
  valueMap.forEach((keys) => {
    if (keys.length > 3) { // Only flag if more than 3 keys share same value
      duplicates.push(...keys);
    }
  });
  
  return { duplicates, interpolationMismatches, emptyValues };
}

export default i18n;