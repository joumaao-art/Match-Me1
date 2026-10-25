import type { ViaPlan } from '@/services/subscription.service';

/** Compare one yearly term with twelve equivalent monthly terms in the same currency. */
export function yearlySavings(plans: ViaPlan[]): number | null {
 const monthly = plans.find(p => p.active && p.billing_interval === 'month');
 const yearly = plans.find(p => p.active && p.billing_interval === 'year');
 if (!monthly || !yearly || monthly.currency !== yearly.currency || !Number.isFinite(monthly.amount) || !Number.isFinite(yearly.amount) || monthly.amount <= 0 || yearly.amount < 0) return null;
 return Math.max(0, Math.round((monthly.amount * 12 - yearly.amount) / (monthly.amount * 12) * 100));
}
