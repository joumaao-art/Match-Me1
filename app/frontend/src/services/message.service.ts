/**
 * Message service - handles real-time messaging operations.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { Message } from '@/types';

class MessageService {
  async getConversations(userId: string) {
    logger.info('[MessageService] Fetching conversations');
    return apiClient.query('getConversations', () =>
      apiClient.supabase
        .from('matches')
        .select('*, messages:messages(content, created_at, read)')
        .or(`job_seeker_id.eq.${userId},company_id.eq.${userId}`)
        .not('seeker_status', 'eq', 'not_interested')
    );
  }

  async getMessages(matchId: string) {
    return apiClient.query('getMessages', () =>
      apiClient.supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
    );
  }

  async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
    logger.info('[MessageService] Sending message');
    return apiClient.query('sendMessage', () =>
      apiClient.supabase.from('messages').insert(message).select().single()
    );
  }

  async markAsRead(matchId: string, userId: string) {
    return apiClient.query('markAsRead', () =>
      apiClient.supabase
        .from('messages')
        .update({ read: true })
        .eq('match_id', matchId)
        .neq('sender_id', userId)
    );
  }

  subscribeToMessages(matchId: string, callback: (message: any) => void) {
    return apiClient.subscribe(`messages:${matchId}`, 'messages', (payload) => {
      if (payload.new?.match_id === matchId) {
        callback(payload.new);
      }
    });
  }
}

export const messageService = new MessageService();
export default messageService;