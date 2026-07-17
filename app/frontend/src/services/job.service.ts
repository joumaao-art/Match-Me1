/**
 * Job service - handles job discovery, matching, and vacancy operations.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { Vacancy, JobMatch, VacancyStatus } from '@/types';

class JobService {
  async getVacancies(filters?: { status?: VacancyStatus; companyId?: string }) {
    logger.info('[JobService] Fetching vacancies', filters);
    return apiClient.query('getVacancies', () => {
      let query = apiClient.supabase.from('vacancies').select('*');
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.companyId) query = query.eq('company_id', filters.companyId);
      return query.order('created_at', { ascending: false });
    });
  }

  async getVacancyById(id: string) {
    return apiClient.query('getVacancyById', () =>
      apiClient.supabase.from('vacancies').select('*').eq('id', id).single()
    );
  }

  async createVacancy(vacancy: Partial<Vacancy>) {
    logger.info('[JobService] Creating vacancy');
    return apiClient.query('createVacancy', () =>
      apiClient.supabase.from('vacancies').insert(vacancy).select().single()
    );
  }

  async updateVacancy(id: string, updates: Partial<Vacancy>) {
    return apiClient.query('updateVacancy', () =>
      apiClient.supabase.from('vacancies').update(updates).eq('id', id).select().single()
    );
  }

  async deleteVacancy(id: string) {
    return apiClient.query('deleteVacancy', () =>
      apiClient.supabase.from('vacancies').delete().eq('id', id)
    );
  }

  async getMatches(userId: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'job_seeker_id' : 'company_id';
    return apiClient.query('getMatches', () =>
      apiClient.supabase.from('matches').select('*').eq(column, userId)
    );
  }

  async updateMatchStatus(matchId: string, status: string, role: 'job_seeker' | 'company') {
    const column = role === 'job_seeker' ? 'seeker_status' : 'company_status';
    return apiClient.query('updateMatchStatus', () =>
      apiClient.supabase.from('matches').update({ [column]: status }).eq('id', matchId)
    );
  }

  async getJobCards(seekerId: string) {
    logger.info('[JobService] Fetching job cards for seeker');
    return apiClient.query('getJobCards', () =>
      apiClient.supabase
        .from('vacancies')
        .select('*, companies:company_id(company_name, logo_url, industry)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
    );
  }
}

export const jobService = new JobService();
export default jobService;