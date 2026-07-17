/**
 * Base API client for the mobile app.
 * Wraps Supabase with standardized error handling.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(env.supabase.url, env.supabase.anonKey);
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  get auth() {
    return this.client.auth;
  }

  get storage() {
    return this.client.storage;
  }

  async query<T>(
    operation: string,
    queryFn: () => PromiseLike<{ data: any; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await queryFn();
      if (error) {
        logger.error(`[API] ${operation} failed:`, error);
        return {
          data: null,
          error: { message: error.message || 'An unexpected error occurred', code: error.code, status: error.status },
        };
      }
      return { data, error: null };
    } catch (err: any) {
      logger.error(`[API] ${operation} threw:`, err);
      return { data: null, error: { message: err.message || 'Network error', code: 'NETWORK_ERROR' } };
    }
  }

  subscribe(channel: string, table: string, callback: (payload: any) => void) {
    return this.client
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }
}

export const apiClient = new ApiClient();
export default apiClient;