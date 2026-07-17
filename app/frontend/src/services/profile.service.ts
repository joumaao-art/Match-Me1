/**
 * Profile service - handles user profile CRUD and file uploads.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/types';

class ProfileService {
  /**
   * Get or create user base profile.
   */
  async getUserProfile(userId: string) {
    return apiClient.query('getUserProfile', () =>
      apiClient.supabase.from('user_profiles').select('*').eq('user_id', userId).single() as any
    );
  }

  /**
   * Create user base profile after registration.
   */
  async createUserProfile(userId: string, role: UserRole, displayName?: string) {
    logger.info('[ProfileService] Creating user profile', { role });
    return apiClient.query('createUserProfile', () =>
      apiClient.supabase.from('user_profiles').insert({
        user_id: userId,
        role,
        display_name: displayName,
      }).select().single() as any
    );
  }

  /**
   * Get job seeker profile.
   */
  async getSeekerProfile(userId: string) {
    return apiClient.query('getSeekerProfile', () =>
      apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id', userId).single() as any
    );
  }

  /**
   * Create or update job seeker profile.
   */
  async upsertSeekerProfile(userId: string, data: Record<string, any>) {
    logger.info('[ProfileService] Upserting seeker profile');
    return apiClient.query('upsertSeekerProfile', () =>
      apiClient.supabase.from('job_seeker_profiles').upsert({
        user_id: userId,
        ...data,
      }).select().single() as any
    );
  }

  /**
   * Get company profile.
   */
  async getCompanyProfile(userId: string) {
    return apiClient.query('getCompanyProfile', () =>
      apiClient.supabase.from('company_profiles').select('*').eq('user_id', userId).single() as any
    );
  }

  /**
   * Create or update company profile.
   */
  async upsertCompanyProfile(userId: string, data: Record<string, any>) {
    logger.info('[ProfileService] Upserting company profile');
    return apiClient.query('upsertCompanyProfile', () =>
      apiClient.supabase.from('company_profiles').upsert({
        user_id: userId,
        ...data,
      }).select().single() as any
    );
  }

  /**
   * Upload avatar/profile photo.
   */
  async uploadAvatar(userId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    return apiClient.uploadFile('avatars', path, file);
  }

  /**
   * Upload CV/resume.
   */
  async uploadCV(userId: string, file: File) {
    const path = `${userId}/${Date.now()}_${file.name}`;
    return apiClient.uploadFile('cvs', path, file);
  }

  /**
   * Upload company logo.
   */
  async uploadLogo(userId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/logo.${ext}`;
    return apiClient.uploadFile('logos', path, file);
  }

  /**
   * Mark onboarding as completed.
   */
  async completeOnboarding(userId: string) {
    return apiClient.query('completeOnboarding', () =>
      apiClient.supabase.from('user_profiles').update({ onboarding_completed: true }).eq('user_id', userId) as any
    );
  }
}

export const profileService = new ProfileService();
export default profileService;