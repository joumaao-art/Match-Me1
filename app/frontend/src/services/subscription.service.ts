import { apiClient, type ApiResponse } from './api-client';
import { env } from '@/config/env';

export type ViaPlanId = 'via_premium_monthly' | 'via_premium_yearly';
export interface ViaPlan { id: ViaPlanId; name: string; amount: number; currency: string; billing_interval: 'month' | 'year'; active: boolean }
export interface ViaSubscription {
 id: string; user_id: string; plan: ViaPlanId | null;
 status: 'inactive' | 'checkout_pending' | 'active' | 'payment_failed' | 'cancelled' | 'expired';
 current_period_end: string | null; cancel_at_period_end: boolean; stripe_subscription_id: string | null;
 checkout_session_id: string | null;
}
export interface ViaCatalog { plans: ViaPlan[]; configured: boolean; configurationError?: string }
class SubscriptionService {
 async call<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  try {
   const { data: { session } } = await apiClient.auth.getSession();
   if (!session) throw new Error('Authentication required');
   const response = await fetch(`${env.supabase.url}/functions/v1/app_91d3436dfc_via_payments`, {
    method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: env.supabase.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }), signal: AbortSignal.timeout(15000),
   });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || 'Billing unavailable');
   return { data, error: null };
  } catch (error) { return { data: null, error: { message: (error as Error).message } }; }
 }
 getCatalog() { return this.call<ViaCatalog>('catalog'); }
 getState() { return this.call<{ subscription: ViaSubscription | null }>('state'); }
 getCurrentSubscription(userId: string) {
  return apiClient.query<ViaSubscription>('subscription', () => apiClient.supabase.from('subscriptions').select('*').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)).maybeSingle());
 }
 createCheckoutSession(plan: string, billingCycle: string, returnUrl = window.location.href) {
  return this.call<{ url: string; sessionId: string }>('checkout', { plan, billingCycle, returnUrl, platform: window.ReactNativeWebView ? 'native' : 'web' });
 }
 verifyPayment(sessionId: string) { return this.call<{ verified: boolean }>('verify', { sessionId, returnUrl: window.location.href }); }
 manage() { return this.call<{ url: string }>('manage', { returnUrl: window.location.href, platform: window.ReactNativeWebView ? 'native' : 'web' }); }
 cancelSubscription(_subscriptionId?: string) { return this.manage(); }
 cancelPending() { return this.call<{ cancelled: boolean }>('cancel_pending'); }
}
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
