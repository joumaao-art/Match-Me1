/**
 * Job service for the mobile app.
 */

import { apiClient } from './api-client';
import { logger } from '../lib/logger';
import type { VacancyStatus } from '../types';

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

  async createVacancy(vacancy: Record<string, any>) {
    logger.info('[JobService] Creating vacancy');
    return apiClient.query('createVacancy', () =>
      apiClient.supabase.from('vacancies').insert(vacancy).select().single() as any
    );
  }

  async getMatches(userId: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'job_seeker_id' : 'company_id';
    return apiClient.query('getMatches', () =>
      apiClient.supabase.from('matches').select('*').eq(column, userId) as any
    );
  }

  async updateMatchStatus(matchId: string, status: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'seeker_status' : 'company_status';
    return apiClient.query('updateMatchStatus', () =>
      apiClient.supabase.from('matches').update({ [column]: status }).eq('id', matchId) as any
    );
  }
}

export const jobService = new JobService();
export default jobService;