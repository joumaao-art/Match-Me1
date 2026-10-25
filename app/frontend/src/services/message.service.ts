/**
 * Message service - handles real-time messaging operations
 * with hiring workflow state management.
 */

import { apiClient } from './api-client';
import { logger } from '@/lib/logger';
import type { Message } from '@/types';
import type { ConversationWorkflow, ConversationStatus, HiringStage } from '@/types/messaging.types';

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
   * Get the conversation workflow state for a match.
   */
  async getConversationWorkflow(matchId: string): Promise<ConversationWorkflow | null> {
    logger.info('[MessageService] Fetching conversation workflow', { matchId });
    const result = await apiClient.query<ConversationWorkflow>('getConversationWorkflow', () =>
      apiClient.supabase
        .from('conversation_workflows')
        .select('*')
        .eq('match_id', matchId)
        .single() as any
    );
    return result?.data || null;
  }

  /**
   * Update the conversation workflow status (e.g., company contacts first, reject, close).
   */
  async updateConversationStatus(
    matchId: string,
    newStatus: ConversationStatus,
    updatedBy: string,
    closedReason?: string
  ) {
    logger.info('[MessageService] Updating conversation status', { matchId, newStatus });
    const updatePayload: Record<string, unknown> = {
      conversation_status: newStatus,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    if (closedReason) {
      updatePayload.closed_reason = closedReason;
      updatePayload.closed_at = new Date().toISOString();
      updatePayload.closed_by = updatedBy;
    }

    // If company sends first message, unlock seeker messaging
    if (newStatus === 'company_contacted') {
      updatePayload.first_message_sent_at = new Date().toISOString();
      updatePayload.company_first_message_sent = true;
      updatePayload.seeker_can_message = true;
    }

    // If conversation is being closed, disable messaging for both
    const closedStatuses: ConversationStatus[] = ['rejected', 'withdrawn', 'job_closed', 'conversation_closed', 'blocked'];
    if (closedStatuses.includes(newStatus)) {
      updatePayload.company_can_message = false;
      updatePayload.seeker_can_message = false;
    }

    return apiClient.query('updateConversationStatus', () =>
      apiClient.supabase
        .from('conversation_workflows')
        .update(updatePayload)
        .eq('match_id', matchId) as any
    );
  }

  /**
   * Update the hiring stage (application_status) for a conversation.
   */
  async updateHiringStage(matchId: string, stage: HiringStage, updatedBy: string) {
    logger.info('[MessageService] Updating hiring stage', { matchId, stage });
    return apiClient.query('updateHiringStage', () =>
      apiClient.supabase
        .from('conversation_workflows')
        .update({
          application_status: stage,
          updated_by: updatedBy,
          updated_at: new Date().toISOString(),
        })
        .eq('match_id', matchId) as any
    );
  }

  /**
   * Check if a user can send a message based on workflow permissions.
   */
  async canUserSendMessage(matchId: string, userId: string, userRole: 'company' | 'job_seeker'): Promise<boolean> {
    const workflow = await this.getConversationWorkflow(matchId);
    if (!workflow) return true; // Backward compat: no workflow means unrestricted

    // Check if conversation is closed
    const closedStatuses: ConversationStatus[] = ['rejected', 'withdrawn', 'job_closed', 'conversation_closed', 'blocked'];
    if (closedStatuses.includes(workflow.conversation_status)) return false;

    if (userRole === 'company') {
      return workflow.permissions.company_can_message;
    } else {
      // Seeker can only message if company has sent first message
      return workflow.permissions.seeker_can_message && workflow.permissions.company_first_message_sent;
    }
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
   * Subscribe to workflow status changes for a conversation.
   */
  subscribeToWorkflowChanges(matchId: string, callback: (workflow: any) => void) {
    return apiClient.subscribe(
      `workflow:${matchId}`,
      'conversation_workflows',
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
   * Unsubscribe from workflow changes.
   */
  unsubscribeFromWorkflow(matchId: string) {
    apiClient.unsubscribe(`workflow:${matchId}`);
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