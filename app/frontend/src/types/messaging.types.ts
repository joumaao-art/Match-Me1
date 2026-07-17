/**
 * Messaging-related types.
 */

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  attachment_url?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: 'company' | 'job_seeker';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: string;
  read: boolean;
}