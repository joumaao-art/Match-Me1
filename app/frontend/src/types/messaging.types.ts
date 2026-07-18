/**
 * Messaging-related types with hiring workflow states.
 */

// Hiring workflow states
export type HiringStage =
  | 'new_match'
  | 'allow_company_to_contact_first'
  | 'company_contacted'
  | 'application_under_review'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_sent'
  | 'hired'
  | 'rejected'
  | 'withdrawn_by_seeker'
  | 'job_closed'
  | 'conversation_closed';

// Conversation status for display
export type ConversationStatus =
  | 'new_match'
  | 'waiting_for_company'
  | 'company_contacted'
  | 'under_review'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_sent'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'job_closed'
  | 'conversation_closed'
  | 'blocked';

// Closed reason
export type ClosedReason =
  | 'rejected'
  | 'withdrawn'
  | 'job_filled'
  | 'job_closed'
  | 'job_expired'
  | 'blocked'
  | 'admin_closed';

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  attachment_url?: string;
  created_at: string;
}

export interface ConversationPermissions {
  company_can_message: boolean;
  seeker_can_message: boolean;
  company_first_message_sent: boolean;
  allow_company_to_contact_first: boolean;
}

export interface ConversationWorkflow {
  match_id: string;
  company_id: string;
  seeker_id: string;
  conversation_status: ConversationStatus;
  application_status: HiringStage;
  permissions: ConversationPermissions;
  closed_reason?: ClosedReason;
  closed_by?: string;
  closed_at?: string;
  first_message_sent_at?: string;
}

export interface Conversation {
  id: string;
  name: string;
  role: 'company' | 'job_seeker';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  // Workflow fields
  workflow?: ConversationWorkflow;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: string;
  read: boolean;
}

/**
 * Helper to determine if a job seeker can send messages.
 */
export function canSeekerMessage(workflow?: ConversationWorkflow): boolean {
  if (!workflow) return true; // Backward compat
  return (
    workflow.permissions.seeker_can_message &&
    workflow.permissions.company_first_message_sent &&
    !isConversationClosed(workflow)
  );
}

/**
 * Helper to determine if a company can send messages.
 */
export function canCompanyMessage(workflow?: ConversationWorkflow): boolean {
  if (!workflow) return true; // Backward compat
  return workflow.permissions.company_can_message && !isConversationClosed(workflow);
}

/**
 * Helper to check if conversation is closed/read-only.
 */
export function isConversationClosed(workflow?: ConversationWorkflow): boolean {
  if (!workflow) return false;
  const closedStatuses: ConversationStatus[] = [
    'rejected',
    'withdrawn',
    'job_closed',
    'conversation_closed',
    'blocked',
  ];
  return closedStatuses.includes(workflow.conversation_status);
}

/**
 * Get display badge variant for a conversation status.
 */
export function getStatusBadgeVariant(status: ConversationStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'company_contacted':
    case 'hired':
      return 'default';
    case 'interview_scheduled':
    case 'interview_completed':
    case 'offer_sent':
    case 'under_review':
      return 'secondary';
    case 'rejected':
    case 'conversation_closed':
    case 'blocked':
    case 'job_closed':
      return 'destructive';
    default:
      return 'outline';
  }
}