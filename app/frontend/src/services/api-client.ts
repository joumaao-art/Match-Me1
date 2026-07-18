/**
 * Base API client with centralized error handling.
 * All Supabase interactions go through this abstraction layer.
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Validate Supabase configuration
const SUPABASE_URL = env.supabase.url;
const SUPABASE_ANON_KEY = env.supabase.anonKey;

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder'));

class ApiClient {
  private client: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    // Use real credentials or safe fallbacks that won't cause fetch errors
    const url = SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
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

  /**
   * Execute a query with standardized error handling.
   */
  async query<T>(
    operation: string,
    queryFn: () => PromiseLike<{ data: any; error: any }>
  ): Promise<ApiResponse<T>> {
    // Guard: check if Supabase is properly configured
    if (!isConfigured) {
      logger.error(`[API] ${operation}: Supabase is not configured. Check environment variables.`);
      return {
        data: null,
        error: {
          message: 'Service is not configured. Please contact support.',
          code: 'NOT_CONFIGURED',
        },
      };
    }

    try {
      const { data, error } = await queryFn();
      if (error) {
        logger.error(`[API] ${operation} failed:`, error);
        return {
          data: null,
          error: {
            message: error.message || 'An unexpected error occurred',
            code: error.code,
            status: error.status,
          },
        };
      }
      return { data, error: null };
    } catch (err: any) {
      logger.error(`[API] ${operation} threw:`, err);

      // Provide user-friendly messages for common network errors
      let message = err.message || 'Network error';
      if (message === 'Failed to fetch' || message.includes('NetworkError')) {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
      }

      return {
        data: null,
        error: {
          message,
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * Call a Supabase Edge Function.
   */
  async invokeFunction<T>(functionName: string, body?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.query(functionName, () =>
      this.client.functions.invoke(functionName, { body })
    );
  }

  /**
   * Call a PostgreSQL function via RPC.
   */
  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.query(`rpc:${functionName}`, () =>
      this.client.rpc(functionName, params) as any
    );
  }

  /**
   * Subscribe to real-time changes on a table.
   */
  subscribe(
    channelName: string,
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ): RealtimeChannel {
    // Remove existing channel if any
    const existing = this.channels.get(channelName);
    if (existing) {
      this.client.removeChannel(existing);
    }

    const channelConfig: any = { event: '*', schema: 'public', table };
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = this.client
      .channel(channelName)
      .on('postgres_changes', channelConfig, callback)
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a channel.
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.client.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels.
   */
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      this.client.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Upload a file to Supabase Storage.
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<ApiResponse<{ path: string; publicUrl: string }>> {
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        return { data: null, error: { message: error.message } };
      }

      const { data: urlData } = this.client.storage.from(bucket).getPublicUrl(data.path);

      return {
        data: { path: data.path, publicUrl: urlData.publicUrl },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  /**
   * Delete a file from Supabase Storage.
   */
  async deleteFile(bucket: string, paths: string[]): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.client.storage.from(bucket).remove(paths);
      if (error) {
        return { data: null, error: { message: error.message } };
      }
      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient;