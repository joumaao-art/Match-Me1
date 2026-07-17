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
        .select(`
          *,
          vacancy:vacancies(job_title),
          seeker:job_seeker_profiles!job_seeker_id(first_name, last_name, photo_url),
          company:company_profiles!company_id(company_name, logo_url),
          messages:messages(content, created_at, read, sender_id)
        `)
        .or(`job_seeker_id.eq.${userId},company_id.eq.${userId}`)
        .not('seeker_status', 'eq', 'not_interested')
        .order('updated_at', { ascending: false }) as any
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

  async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
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

  /**
   * Get unread message count.
   */
  async getUnreadCount(userId: string) {
    return apiClient.rpc<number>('get_unread_count', { p_user_id: userId });
  }

  /**
   * Subscribe to new messages in a match.
   */
  subscribeToMessages(matchId: string, callback: (message: any) => void) {
    return apiClient.subscribe(
      `messages:${matchId}`,
      'messages',
      (payload) => {
        if (payload.new?.match_id === matchId) {
          callback(payload.new);
        }
      },
      `match_id=eq.${matchId}`
    );
  }

  /**
   * Unsubscribe from a message channel.
   */
  unsubscribeFromMessages(matchId: string) {
    apiClient.unsubscribe(`messages:${matchId}`);
  }

  /**
   * Upload a chat attachment.
   */
  async uploadAttachment(matchId: string, file: File) {
    const path = `${matchId}/${Date.now()}_${file.name}`;
    return apiClient.uploadFile('attachments', path, file);
  }
}

export const messageService = new MessageService();
export default messageService;