/**
 * Minimal product-analytics event sink. Events are append-only: a reversed
 * action is recorded as a new event (for example `discover_undo`) instead of
 * deleting the original, so historical analysis stays possible.
 */

import { logger } from './logger';

export type AnalyticsEvent =
  | 'discover_pass' | 'discover_apply' | 'discover_undo'
  | 'preferences_saved' | 'preferences_opened'
  | 'dashboard_card_open' | 'profile_phone_saved';

const KEY = 'matchme-analytics-events';
const MAX = 500;

export function trackEvent(name: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  const event = { name, props, at: new Date().toISOString() };
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown[];
    list.push(event);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch { /* storage unavailable: analytics must never break the product */ }
  logger.info(`[analytics] ${name}`, props);
}

export function readEvents(): { name: AnalyticsEvent; props: Record<string, unknown>; at: string }[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
