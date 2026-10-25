import { apiClient } from './api-client';
import { useAuthStore } from '@/stores';

export interface ApplicationConversation {
  id: string;
  vacancy_id: string;
  seeker_id: string;
  company_user_id: string;
  first_contact_at: string | null;
  closed: boolean;
  created_at: string;
  job_title: string;
  company_name: string;
  participant_name: string;
  application_status: string;
  company_status: string | null;
  unavailable: boolean;
  last_message: string | null;
  unread_count: number;
}
export interface ApplicationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  request_key: string;
  created_at: string;
  read_at: string | null;
}
export interface ApplicationInterview {
  id: string;
  conversation_id: string;
  starts_at: string;
  duration_minutes: number;
  location: string;
  status: 'invited' | 'accepted' | 'declined' | 'cancelled';
  request_key: string;
  created_at: string;
}

export async function assertCommunicationOwner(userId: string) {
  const { data: { session }, error } = await apiClient.auth.getSession();
  if (error) throw error;
  if (!userId || session?.user.id !== userId || useAuthStore.getState().userId !== userId) {
    throw new Error('Your account changed. Reopen this page to continue.');
  }
}
async function ownerRpc<T>(userId: string, name: string, params?: Record<string, unknown>): Promise<T> {
  await assertCommunicationOwner(userId);
  const result = await apiClient.supabase.rpc(name, params).abortSignal(AbortSignal.timeout(12000));
  if (result.error) throw new Error(result.error.message);
  await assertCommunicationOwner(userId);
  return result.data as T;
}

export const messageService = {
  getConversations: (userId: string) => ownerRpc<ApplicationConversation[]>(userId, 'get_application_conversations'),
  startConversation: (userId: string, vacancyId: string, seekerId: string) => ownerRpc<string>(userId, 'start_application_conversation', { p_vacancy: vacancyId, p_seeker: seekerId }),
  async getMessages(userId: string, conversationId: string, limit = 50) {
    await assertCommunicationOwner(userId);
    const { data, error } = await apiClient.supabase.from('app_91d3436dfc_messages')
      .select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit).abortSignal(AbortSignal.timeout(10000));
    if (error) throw error;
    await assertCommunicationOwner(userId);
    return (data as ApplicationMessage[]).reverse();
  },
  sendMessage: (userId: string, conversationId: string, content: string, requestKey: string) => ownerRpc<string>(userId, 'send_application_message', { p_conversation: conversationId, p_content: content, p_request: requestKey }),
  markAsRead: (userId: string, conversationId: string) => ownerRpc<void>(userId, 'read_application_messages', { p_conversation: conversationId }),
  closeConversation: (userId: string, conversationId: string) => ownerRpc<void>(userId, 'close_application_conversation', { p_conversation: conversationId }),
  async getInterviews(userId: string, conversationId: string) {
    await assertCommunicationOwner(userId);
    const { data, error } = await apiClient.supabase.from('app_91d3436dfc_interviews').select('*')
      .eq('conversation_id', conversationId).order('starts_at', { ascending: false }).abortSignal(AbortSignal.timeout(10000));
    if (error) throw error;
    await assertCommunicationOwner(userId);
    return data as ApplicationInterview[];
  },
  scheduleInterview: (userId: string, conversationId: string, startsAt: string, minutes: number, location: string, requestKey: string) => ownerRpc<string>(userId, 'schedule_application_interview', { p_conversation: conversationId, p_start: startsAt, p_minutes: minutes, p_location: location, p_request: requestKey }),
  respondInterview: (userId: string, interviewId: string, status: 'accepted' | 'declined' | 'cancelled') => ownerRpc<void>(userId, 'respond_application_interview', { p_interview: interviewId, p_status: status }),
  async getUnreadCount(userId: string) {
    try {
      const conversations = await this.getConversations(userId);
      return { data: conversations.reduce((sum, c) => sum + Number(c.unread_count), 0), error: null };
    } catch (error) {
      return { data: null, error: { message: (error as Error).message } };
    }
  },
};
export default messageService;
