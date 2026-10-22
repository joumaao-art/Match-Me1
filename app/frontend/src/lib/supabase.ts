/**
 * Supabase client re-export for backward compatibility.
 * New code should use services from '@/services' instead.
 * 
 * @deprecated Use apiClient from '@/services/api-client' for new code.
 */

import { apiClient } from '@/services/api-client';

// Re-export the supabase client for backward compatibility
export const supabase = apiClient.supabase;

// Re-export types for backward compatibility
export type { UserProfile, JobSeekerProfile, CompanyProfile, Vacancy, JobMatch as Match, Message, UserSubscription as Subscription } from '@/types';