/**
 * i18n utility functions.
 */

import type { Locale, Direction } from '../types/common.types';

const RTL_LOCALES: Locale[] = ['ar'];

export function getDirection(locale: Locale): Direction {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}