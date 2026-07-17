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
        .single()
    );
  }

  async createCheckoutSession(plan: SubscriptionPlan, billingCycle: BillingCycle) {
    logger.info('[SubscriptionService] Creating checkout session', { plan, billingCycle });
    return apiClient.query('createCheckoutSession', () =>
      apiClient.supabase.functions.invoke('create-checkout-session', {
        body: { plan, billingCycle },
      })
    );
  }

  async cancelSubscription(subscriptionId: string) {
    logger.info('[SubscriptionService] Cancelling subscription');
    return apiClient.query('cancelSubscription', () =>
      apiClient.supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId },
      })
    );
  }

  async verifyPayment(sessionId: string) {
    return apiClient.query('verifyPayment', () =>
      apiClient.supabase.functions.invoke('verify-payment', {
        body: { sessionId },
      })
    );
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;