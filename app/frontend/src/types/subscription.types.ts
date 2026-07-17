/**
 * Subscription and billing types.
 */

export type SubscriptionPlan = 'free' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  billing_cycle?: BillingCycle;
  status: SubscriptionStatus;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  popular?: boolean;
}