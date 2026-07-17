/**
 * Shared localization strings for English and Arabic.
 * Used by both web (react-i18next) and mobile (i18n-js/expo).
 */

export { en } from './en';
export { ar } from './ar';
export { getDirection, isRTL } from './utils';

export type TranslationKey = keyof typeof import('./en').en;