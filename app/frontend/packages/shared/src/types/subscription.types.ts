/**
 * Subscription, payment, and billing types.
 */

export type SubscriptionPlan = 'free' | 'premium' | 'business' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';

export interface PlanDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  targetRole: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  cancelledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  description?: string;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  paymentId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  description?: string;
  lineItems: InvoiceLineItem[];
  dueDate?: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}