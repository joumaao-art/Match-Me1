/**
 * Profile service - handles user profile CRUD and file uploads.
 *
 * IMPORTANT — idempotency contract
 * ------------------------------------------------------------
 * All profile writes in this service are idempotent:
 *  - `user_profiles.user_id` and `job_seeker_profiles.user_id` /
 *    `company_profiles.user_id` are UNIQUE.
 *  - Every write therefore targets `onConflict: 'user_id'`.
 *    Without an explicit conflict target, PostgREST falls back to the
 *    table PRIMARY KEY, and a retry/duplicate write fails with
 *    23505 duplicate key instead of updating the row. That single
 *    mistake is what previously stalled the Job Seeker signup flow
 *    before it could reach the Welcome screen.
 *  - Reads use `maybeSingle()` so a missing row is a normal `null`
 *    result instead of a PGRST116 error.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/types';

/** Conflict target shared by every profile table (see file header). */
const USER_CONFLICT_TARGET = 'user_id';

class ProfileService {
  /**
   * Get the user's base profile.
   * Returns `null` when the row does not exist yet (not an error).
   */
  async getUserProfile(userId: string) {
    return apiClient.query('getUserProfile', () =>
      apiClient.supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle() as any
    );
  }

  /**
   * Create the user's base profile after registration.
   * Idempotent: an existing profile is left untouched, so a retry or a
   * returning user never produces a duplicate-key failure.
   */
  async createUserProfile(userId: string, role: UserRole, displayName?: string) {
    logger.info('[ProfileService] Ensuring user profile', { role });
    return apiClient.query('createUserProfile', () =>
      apiClient.supabase
        .from('user_profiles')
        .upsert(
          { user_id: userId, role, display_name: displayName },
          { onConflict: USER_CONFLICT_TARGET, ignoreDuplicates: true }
        )
        .select()
        .maybeSingle() as any
    );
  }

  /**
   * Update mutable fields of the base profile (role is intentionally not writable here).
   */
  async updateUserProfile(userId: string, data: Record<string, any>) {
    return apiClient.query('updateUserProfile', () =>
      apiClient.supabase.from('user_profiles').update(data).eq('user_id', userId).select().maybeSingle() as any
    );
  }

  /**
   * Get the job seeker profile.
   * Returns `null` when the row does not exist yet (not an error).
   */
  async getSeekerProfile(userId: string) {
    return apiClient.query('getSeekerProfile', () =>
      apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id', userId).maybeSingle() as any
    );
  }

  /**
   * Create or update the job seeker profile.
   * Targets `user_id` explicitly so onboarding step saves persist on both the
   * first run and every retry.
   */
  async upsertSeekerProfile(userId: string, data: Record<string, any>) {
    logger.info('[ProfileService] Upserting seeker profile');
    return apiClient.query('upsertSeekerProfile', () =>
      apiClient.supabase
        .from('job_seeker_profiles')
        .upsert({ user_id: userId, ...data }, { onConflict: USER_CONFLICT_TARGET })
        .select()
        .single() as any
    );
  }

  /**
   * Get the company profile.
   * Returns `null` when the row does not exist yet (not an error).
   */
  async getCompanyProfile(userId: string) {
    return apiClient.query('getCompanyProfile', () =>
      apiClient.supabase.from('company_profiles').select('*').eq('user_id', userId).maybeSingle() as any
    );
  }

  /**
   * Create or update the company profile.
   * Targets `user_id` explicitly, mirroring the seeker path.
   */
  async upsertCompanyProfile(userId: string, data: Record<string, any>) {
    logger.info('[ProfileService] Upserting company profile');
    return apiClient.query('upsertCompanyProfile', () =>
      apiClient.supabase
        .from('company_profiles')
        .upsert({ user_id: userId, ...data }, { onConflict: USER_CONFLICT_TARGET })
        .select()
        .single() as any
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
    return apiClient.query<{ path: string; publicUrl: string }>('uploadCV', async () => {
      const { data: { user }, error: authError } = await apiClient.auth.getUser();
      if (authError || user?.id !== userId) throw new Error('Authentication required');
      if (file.size > 10 * 1024 * 1024 || !/\.(pdf|doc|docx|txt)$/i.test(file.name)) throw new Error('CV must be PDF, DOC, DOCX or TXT, at most 10 MB.');
      const path = `${userId}/${Date.now()}_${crypto.randomUUID()}_${file.name.replace(/[^\p{L}\p{N}._-]/gu,'_')}`;
      const upload = await apiClient.storage.from('cvs').upload(path, file, { upsert: false });
      if (upload.error) return {data: null, error: upload.error};
      const saved = await apiClient.supabase.rpc('attach_profile_cv', { p_path: path, p_name: file.name }).abortSignal(AbortSignal.timeout(10000));
      if (saved.error) return {data: null, error: saved.error};
      return {data: {path, publicUrl: path}, error: null};
    });
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
   * Idempotent by nature of the update.
   */
  async completeOnboarding(userId: string) {
    return apiClient.query('completeOnboarding', () =>
      apiClient.supabase.from('user_profiles').update({ onboarding_completed: true }).eq('user_id', userId) as any
    );
  }
}

export const profileService = new ProfileService();
export default profileService;
