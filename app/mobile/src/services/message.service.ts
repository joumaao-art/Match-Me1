/**
 * Message service for the mobile app.
 */

import { apiClient } from './api-client';
import { logger } from '../lib/logger';

class MessageService {
  async getConversations(userId: string) {
    logger.info('[MessageService] Fetching conversations');
    return apiClient.query('getConversations', () =>
      apiClient.supabase
        .from('matches')
        .select('*, messages:messages(content, created_at, read)')
        .or(`job_seeker_id.eq.${userId},company_id.eq.${userId}`) as any
    );
  }

  async getMessages(matchId: string) {
    return apiClient.query('getMessages', () =>
      apiClient.supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true }) as any
    );
  }

  async sendMessage(message: { match_id: string; sender_id: string; content: string }) {
    logger.info('[MessageService] Sending message');
    return apiClient.query('sendMessage', () =>
      apiClient.supabase.from('messages').insert(message).select().single() as any
    );
  }

  async markAsRead(matchId: string, userId: string) {
    return apiClient.query('markAsRead', () =>
      apiClient.supabase
        .from('messages')
        .update({ read: true })
        .eq('match_id', matchId)
        .neq('sender_id', userId) as any
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