/**
 * Job service - handles job discovery, matching, and vacancy operations.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { Vacancy, VacancyStatus, JobCard } from '@/types/job.types';

class JobService {
  async getVacancies(filters?: { status?: VacancyStatus; companyId?: string }) {
    logger.info('[JobService] Fetching vacancies', filters);
    let query = apiClient.supabase.from('vacancies').select('*');
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.companyId) query = query.eq('company_id', filters.companyId);
    return apiClient.query('getVacancies', () =>
      query.order('created_at', { ascending: false }) as any
    );
  }

  async getVacancyById(id: string) {
    return apiClient.query('getVacancyById', () =>
      apiClient.supabase.from('vacancies').select('*').eq('id', id).single() as any
    );
  }

  async createVacancy(vacancy: Partial<Vacancy>) {
    logger.info('[JobService] Creating vacancy');
    return apiClient.query('createVacancy', () =>
      apiClient.supabase.from('vacancies').insert(vacancy).select().single() as any
    );
  }

  async updateVacancy(id: string, updates: Partial<Vacancy>) {
    return apiClient.query('updateVacancy', () =>
      apiClient.supabase.from('vacancies').update(updates).eq('id', id).select().single() as any
    );
  }

  async deleteVacancy(id: string) {
    return apiClient.query('deleteVacancy', () =>
      apiClient.supabase.from('vacancies').delete().eq('id', id) as any
    );
  }

  /**
   * Get job cards with compatibility scores using the database function.
   */
  async getJobCards(limit = 20, offset = 0) {
    logger.info('[JobService] Fetching job cards with scores');
    return apiClient.rpc<JobCard[]>('get_job_cards_for_seeker', {
      p_limit: limit,
      p_offset: offset,
    });
  }

  /**
   * Create a match (seeker swipes right).
   */
  async createMatch(vacancyId: string, status: 'interested' | 'not_interested' = 'interested') {
    logger.info('[JobService] Creating match', { vacancyId, status });
    return apiClient.rpc('create_match', {
      p_vacancy_id: vacancyId,
      p_seeker_status: status,
    });
  }

  async getMatches(userId: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'job_seeker_id' : 'company_id';
    return apiClient.query('getMatches', () =>
      apiClient.supabase
        .from('matches')
        .select('*, vacancy:vacancies(*), seeker:job_seeker_profiles!job_seeker_id(*), company:company_profiles!company_id(*)')
        .eq(column, userId)
        .order('compatibility_score', { ascending: false }) as any
    );
  }

  async updateMatchStatus(matchId: string, status: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'seeker_status' : 'company_status';
    return apiClient.query('updateMatchStatus', () =>
      apiClient.supabase.from('matches').update({ [column]: status }).eq('id', matchId) as any
    );
  }

  /**
   * Subscribe to new matches in real-time.
   */
  subscribeToMatches(userId: string, role: 'job_seeker' | 'company', callback: (match: any) => void) {
    const column = role === 'job_seeker' ? 'job_seeker_id' : 'company_id';
    return apiClient.subscribe(
      `matches:${userId}`,
      'matches',
      callback,
      `${column}=eq.${userId}`
    );
  }
}

export const jobService = new JobService();
export default jobService;