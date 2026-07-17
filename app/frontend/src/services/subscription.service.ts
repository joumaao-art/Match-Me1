/**
 * Subscription service - handles billing and plan management.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { SubscriptionPlan, BillingCycle } from '@/types';

class SubscriptionService {
  async getCurrentSubscription(userId: string) {
    return apiClient.query('getCurrentSubscription', () =>
      apiClient.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single() as any
    );
  }

  /**
   * Create a Stripe checkout session via Edge Function.
   */
  async createCheckoutSession(plan: SubscriptionPlan, billingCycle: BillingCycle) {
    logger.info('[SubscriptionService] Creating checkout session', { plan, billingCycle });
    return apiClient.invokeFunction<{ url: string; sessionId: string }>('create-checkout-session', {
      plan,
      billingCycle,
    });
  }

  /**
   * Verify payment after Stripe checkout redirect.
   */
  async verifyPayment(sessionId: string) {
    return apiClient.invokeFunction('verify-payment', { sessionId });
  }

  /**
   * Cancel subscription via Edge Function.
   */
  async cancelSubscription(subscriptionId: string) {
    logger.info('[SubscriptionService] Cancelling subscription');
    return apiClient.invokeFunction('cancel-subscription', { subscriptionId });
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;