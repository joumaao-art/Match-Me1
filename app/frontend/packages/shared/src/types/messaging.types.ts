/**
 * Messaging and conversation types.
 */

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'interview_invite';

export interface Conversation {
  id: string;
  matchId: string;
  participant1: string;
  participant2: string;
  lastMessageId?: string;
  lastMessageAt?: string;
  isArchivedBy1: boolean;
  isArchivedBy2: boolean;
  isBlocked: boolean;
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  messageType: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ConversationWithDetails extends Conversation {
  otherParticipant: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}