import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';
import { BackButton } from '@/components/shared';
import {
  type ConversationWorkflow, type ConversationStatus, type HiringStage,
  canSeekerMessage, canCompanyMessage, isConversationClosed, getStatusBadgeVariant
} from '@/types/messaging.types';
import {
  MessageSquare, Send, Paperclip, Image, FileText, Check, CheckCheck,
  Search, MoreVertical, Archive, Flag, Ban, ArrowLeft,
  Download, Lock, Clock, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'cv' | 'system';
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  replyTo?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantCompany?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  matchScore?: number;
  // Hiring workflow
  workflow: ConversationWorkflow;
}

// ============================================================
// Mock Data with Workflow States
// ============================================================

const CURRENT_USER_ID = 'user-1';

const mockConversations: Conversation[] = [
  {
    id: 'conv-1', participantId: 'p-1', participantName: 'Fatima Al-Zahra', participantRole: 'Head of Recruitment', participantCompany: 'TechCorp',
    lastMessage: 'We would love to schedule an interview with you!', lastMessageTime: Date.now() - 120000, unreadCount: 2, isOnline: true, isTyping: false, isArchived: false, isBlocked: false, matchScore: 94,
    workflow: {
      match_id: 'match-1', company_id: 'comp-1', seeker_id: CURRENT_USER_ID,
      conversation_status: 'company_contacted', application_status: 'interview_scheduled',
      permissions: { company_can_message: true, seeker_can_message: true, company_first_message_sent: true, allow_company_to_contact_first: true },
      first_message_sent_at: new Date(Date.now() - 600000).toISOString()
    }
  },
  {
    id: 'conv-2', participantId: 'p-2', participantName: 'Mohammed Ali', participantRole: 'Senior Recruiter', participantCompany: 'DataFlow',
    lastMessage: 'Thank you for your interest. Can you share your CV?', lastMessageTime: Date.now() - 3600000, unreadCount: 0, isOnline: true, isTyping: false, isArchived: false, isBlocked: false, matchScore: 87,
    workflow: {
      match_id: 'match-2', company_id: 'comp-2', seeker_id: CURRENT_USER_ID,
      conversation_status: 'company_contacted', application_status: 'company_contacted',
      permissions: { company_can_message: true, seeker_can_message: true, company_first_message_sent: true, allow_company_to_contact_first: true },
      first_message_sent_at: new Date(Date.now() - 7200000).toISOString()
    }
  },
  {
    id: 'conv-3', participantId: 'p-3', participantName: 'Sara Al-Rashid', participantRole: 'HR Manager', participantCompany: 'FinanceHub',
    lastMessage: 'The position has been filled. Thank you!', lastMessageTime: Date.now() - 86400000, unreadCount: 0, isOnline: false, isTyping: false, isArchived: false, isBlocked: false, matchScore: 78,
    workflow: {
      match_id: 'match-3', company_id: 'comp-3', seeker_id: CURRENT_USER_ID,
      conversation_status: 'job_closed', application_status: 'job_closed',
      permissions: { company_can_message: false, seeker_can_message: false, company_first_message_sent: true, allow_company_to_contact_first: true },
      closed_reason: 'job_filled', closed_at: new Date(Date.now() - 86400000).toISOString()
    }
  },
  {
    id: 'conv-4', participantId: 'p-4', participantName: 'Omar Khalil', participantRole: 'CTO', participantCompany: 'CloudNine',
    lastMessage: '', lastMessageTime: Date.now() - 172800000, unreadCount: 0, isOnline: false, isTyping: false, isArchived: false, isBlocked: false, matchScore: 71,
    workflow: {
      match_id: 'match-4', company_id: 'comp-4', seeker_id: CURRENT_USER_ID,
      conversation_status: 'waiting_for_company', application_status: 'allow_company_to_contact_first',
      permissions: { company_can_message: true, seeker_can_message: false, company_first_message_sent: false, allow_company_to_contact_first: true }
    }
  },
  {
    id: 'conv-5', participantId: 'p-5', participantName: 'Layla Hassan', participantRole: 'VP Engineering', participantCompany: 'InnovateTech',
    lastMessage: 'Unfortunately we decided to go with another candidate.', lastMessageTime: Date.now() - 259200000, unreadCount: 0, isOnline: false, isTyping: false, isArchived: false, isBlocked: false, matchScore: 82,
    workflow: {
      match_id: 'match-5', company_id: 'comp-5', seeker_id: CURRENT_USER_ID,
      conversation_status: 'rejected', application_status: 'rejected',
      permissions: { company_can_message: false, seeker_can_message: false, company_first_message_sent: true, allow_company_to_contact_first: true },
      closed_reason: 'rejected', closed_at: new Date(Date.now() - 259200000).toISOString()
    }
  },
];

const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', senderId: 'p-1', text: 'Hi Ahmed! We reviewed your profile and are very impressed.', timestamp: Date.now() - 600000, status: 'read', type: 'text' },
    { id: 'm2', senderId: CURRENT_USER_ID, text: 'Thank you! I\'m very interested in the Senior Frontend Developer role.', timestamp: Date.now() - 540000, status: 'read', type: 'text' },
    { id: 'm3', senderId: 'p-1', text: 'Great! Your skills in React and TypeScript are exactly what we need.', timestamp: Date.now() - 480000, status: 'read', type: 'text' },
    { id: 'm4', senderId: CURRENT_USER_ID, text: 'I have 5 years of experience with both. Here\'s my latest CV.', timestamp: Date.now() - 420000, status: 'read', type: 'text' },
    { id: 'm5', senderId: CURRENT_USER_ID, text: '', timestamp: Date.now() - 360000, status: 'read', type: 'cv', fileName: 'Ahmed_Hassan_CV_2026.pdf', fileSize: '2.4 MB' },
    { id: 'm6', senderId: 'p-1', text: 'Perfect! I\'ve reviewed it. Very impressive background.', timestamp: Date.now() - 300000, status: 'read', type: 'text' },
    { id: 'm7', senderId: 'p-1', text: 'We would love to schedule an interview with you!', timestamp: Date.now() - 120000, status: 'delivered', type: 'text' },
    { id: 'm8', senderId: 'p-1', text: 'Are you available this Thursday at 2 PM?', timestamp: Date.now() - 60000, status: 'delivered', type: 'text' },
  ],
  'conv-2': [
    { id: 'm9', senderId: 'p-2', text: 'Hello Ahmed, we matched on MatchMe! Your profile looks great.', timestamp: Date.now() - 7200000, status: 'read', type: 'text' },
    { id: 'm10', senderId: CURRENT_USER_ID, text: 'Hi Mohammed! Thanks for reaching out. The Full Stack role sounds interesting.', timestamp: Date.now() - 7000000, status: 'read', type: 'text' },
    { id: 'm11', senderId: 'p-2', text: 'Thank you for your interest. Can you share your CV?', timestamp: Date.now() - 3600000, status: 'read', type: 'text' },
  ],
  'conv-3': [
    { id: 'm12', senderId: 'p-3', text: 'Hi Ahmed, thank you for applying to the Mobile Developer position.', timestamp: Date.now() - 172800000, status: 'read', type: 'text' },
    { id: 'm13', senderId: CURRENT_USER_ID, text: 'Thank you for considering my application!', timestamp: Date.now() - 170000000, status: 'read', type: 'text' },
    { id: 'm14', senderId: 'p-3', text: 'The position has been filled. Thank you!', timestamp: Date.now() - 86400000, status: 'read', type: 'system' },
  ],
  'conv-4': [],
  'conv-5': [
    { id: 'm15', senderId: 'p-5', text: 'Hi Ahmed, thanks for your interest in the Lead Developer role.', timestamp: Date.now() - 432000000, status: 'read', type: 'text' },
    { id: 'm16', senderId: CURRENT_USER_ID, text: 'Thank you! I\'d love to learn more about the team.', timestamp: Date.now() - 430000000, status: 'read', type: 'text' },
    { id: 'm17', senderId: 'p-5', text: 'Unfortunately we decided to go with another candidate. Best of luck!', timestamp: Date.now() - 259200000, status: 'read', type: 'system' },
  ],
};

// ============================================================
// Messaging Engine (Real-time simulation)
// ============================================================

class MessagingEngine {
  private listeners: Map<string, ((msg: Message) => void)[]> = new Map();
  private typingListeners: Map<string, ((isTyping: boolean) => void)[]> = new Map();
  private readReceiptListeners: Map<string, ((msgId: string) => void)[]> = new Map();
  private statusListeners: Map<string, ((status: ConversationStatus) => void)[]> = new Map();

  subscribe(convId: string, callback: (msg: Message) => void): () => void {
    if (!this.listeners.has(convId)) this.listeners.set(convId, []);
    this.listeners.get(convId)!.push(callback);
    return () => {
      const cbs = this.listeners.get(convId);
      if (cbs) { const idx = cbs.indexOf(callback); if (idx > -1) cbs.splice(idx, 1); }
    };
  }

  subscribeTyping(convId: string, callback: (isTyping: boolean) => void): () => void {
    if (!this.typingListeners.has(convId)) this.typingListeners.set(convId, []);
    this.typingListeners.get(convId)!.push(callback);
    return () => {
      const cbs = this.typingListeners.get(convId);
      if (cbs) { const idx = cbs.indexOf(callback); if (idx > -1) cbs.splice(idx, 1); }
    };
  }

  subscribeReadReceipts(convId: string, callback: (msgId: string) => void): () => void {
    if (!this.readReceiptListeners.has(convId)) this.readReceiptListeners.set(convId, []);
    this.readReceiptListeners.get(convId)!.push(callback);
    return () => {
      const cbs = this.readReceiptListeners.get(convId);
      if (cbs) { const idx = cbs.indexOf(callback); if (idx > -1) cbs.splice(idx, 1); }
    };
  }

  subscribeStatus(convId: string, callback: (status: ConversationStatus) => void): () => void {
    if (!this.statusListeners.has(convId)) this.statusListeners.set(convId, []);
    this.statusListeners.get(convId)!.push(callback);
    return () => {
      const cbs = this.statusListeners.get(convId);
      if (cbs) { const idx = cbs.indexOf(callback); if (idx > -1) cbs.splice(idx, 1); }
    };
  }

  sendMessage(convId: string, msg: Message) {
    const cbs = this.listeners.get(convId);
    if (cbs) cbs.forEach(cb => cb(msg));
    setTimeout(() => {
      msg.status = 'delivered';
      const rcbs = this.readReceiptListeners.get(convId);
      if (rcbs) rcbs.forEach(cb => cb(msg.id));
    }, 500);
    setTimeout(() => {
      msg.status = 'read';
      const rcbs = this.readReceiptListeners.get(convId);
      if (rcbs) rcbs.forEach(cb => cb(msg.id));
    }, 2000);
  }

  emitTyping(convId: string, isTyping: boolean) {
    const cbs = this.typingListeners.get(convId);
    if (cbs) cbs.forEach(cb => cb(isTyping));
  }

  emitStatusChange(convId: string, status: ConversationStatus) {
    const cbs = this.statusListeners.get(convId);
    if (cbs) cbs.forEach(cb => cb(status));
  }

  simulateReply(convId: string, participantId: string) {
    this.emitTyping(convId, true);
    setTimeout(() => {
      this.emitTyping(convId, false);
      const replies = [
        'That sounds great! Let me check my calendar.',
        'Thank you for sharing. I\'ll review and get back to you.',
        'Perfect! Looking forward to it.',
        'Could you tell me more about your experience with that?',
      ];
      const reply: Message = {
        id: `msg-${Date.now()}`,
        senderId: participantId,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: Date.now(),
        status: 'delivered',
        type: 'text',
      };
      const cbs = this.listeners.get(convId);
      if (cbs) cbs.forEach(cb => cb(reply));
    }, 2000 + Math.random() * 2000);
  }
}

const messagingEngine = new MessagingEngine();

// ============================================================
// Status Badge Component
// ============================================================

function WorkflowStatusBadge({ status }: { status: ConversationStatus }) {
  const { t } = useTranslation();
  const variant = getStatusBadgeVariant(status);

  const statusLabels: Record<ConversationStatus, string> = {
    new_match: t('workflow_new_match'),
    waiting_for_company: t('workflow_waiting_for_company'),
    company_contacted: t('workflow_company_contacted'),
    under_review: t('workflow_under_review'),
    interview_scheduled: t('workflow_interview_scheduled'),
    interview_completed: t('workflow_interview_completed'),
    offer_sent: t('workflow_offer_sent'),
    hired: t('workflow_hired'),
    rejected: t('workflow_rejected'),
    withdrawn: t('workflow_withdrawn'),
    job_closed: t('workflow_job_closed'),
    conversation_closed: t('workflow_conversation_closed'),
    blocked: t('workflow_blocked'),
  };

  const statusIcons: Record<ConversationStatus, React.ReactNode> = {
    new_match: <CheckCircle2 className="w-3 h-3" />,
    waiting_for_company: <Clock className="w-3 h-3" />,
    company_contacted: <MessageSquare className="w-3 h-3" />,
    under_review: <Clock className="w-3 h-3" />,
    interview_scheduled: <Clock className="w-3 h-3" />,
    interview_completed: <CheckCircle2 className="w-3 h-3" />,
    offer_sent: <CheckCircle2 className="w-3 h-3" />,
    hired: <CheckCircle2 className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
    withdrawn: <XCircle className="w-3 h-3" />,
    job_closed: <Lock className="w-3 h-3" />,
    conversation_closed: <Lock className="w-3 h-3" />,
    blocked: <Ban className="w-3 h-3" />,
  };

  return (
    <Badge variant={variant} className="text-[10px] flex items-center gap-1 whitespace-nowrap">
      {statusIcons[status]}
      {statusLabels[status]}
    </Badge>
  );
}

// ============================================================
// Locked Conversation View
// ============================================================

function LockedConversationView({ workflow, userRole }: { workflow: ConversationWorkflow; userRole: string }) {
  const { t } = useTranslation();

  const isClosed = isConversationClosed(workflow);
  const isWaiting = workflow.conversation_status === 'waiting_for_company' || workflow.conversation_status === 'new_match';

  if (isClosed) {
    let closedMessage = t('workflow_closed_generic');
    if (workflow.conversation_status === 'rejected') {
      closedMessage = t('workflow_closed_by_company');
    } else if (workflow.conversation_status === 'withdrawn') {
      closedMessage = t('workflow_closed_by_seeker');
    } else if (workflow.conversation_status === 'job_closed') {
      closedMessage = t('workflow_job_closed_message');
    } else if (workflow.conversation_status === 'blocked') {
      closedMessage = t('conversation_blocked');
    }

    return (
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-center gap-2 py-3">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">{closedMessage}</p>
        </div>
      </div>
    );
  }

  if (isWaiting && userRole !== 'company') {
    return (
      <div className="p-4 border-t border-border bg-amber-50 dark:bg-amber-950/20">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              {t('workflow_waiting_for_company')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t('workflow_waiting_message')}
          </p>
          <Button disabled className="cursor-not-allowed opacity-50">
            <Send className="w-4 h-4 me-2" />
            {t('send_message')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// Components
// ============================================================

function MessageStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sent': return <Check className="w-3 h-3 text-muted-foreground" />;
    case 'delivered': return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    case 'read': return <CheckCheck className="w-3 h-3 text-primary" />;
    default: return null;
  }
}

function FileMessage({ msg }: { msg: Message }) {
  const icon = msg.type === 'cv' ? <FileText className="w-5 h-5 text-primary" /> :
               msg.type === 'image' ? <Image className="w-5 h-5 text-green-600" /> :
               <Paperclip className="w-5 h-5 text-accent" />;

  return (
    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3 min-w-[200px]">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{msg.fileName}</p>
        <p className="text-xs text-muted-foreground">{msg.fileSize}</p>
      </div>
      <Button size="sm" variant="ghost" className="cursor-pointer shrink-0"><Download className="w-4 h-4" /></Button>
    </div>
  );
}

function ConversationList({
  conversations, activeId, onSelect, searchQuery, setSearchQuery, showArchived, setShowArchived, backFallback, userRole
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
  backFallback: string;
  userRole: string;
}) {
  const { t } = useTranslation();

  const filtered = conversations.filter(c => {
    if (c.isBlocked && c.workflow.conversation_status !== 'blocked') return false;
    if (showArchived) return c.isArchived;
    if (c.isArchived) return false;
    if (searchQuery) return c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) || c.participantCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return t('just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <div className="flex flex-col h-full border-e border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <BackButton fallbackRoute={backFallback} />
          <h2 className="text-lg font-bold font-[Poppins]">{t('messages')}</h2>
        </div>
        <div className="relative"><Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder={t('search_conversations')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ps-9 h-9" /></div>
        <div className="flex gap-2 mt-3">
          <Badge variant={!showArchived ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setShowArchived(false)}>{t('active')}</Badge>
          <Badge variant={showArchived ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setShowArchived(true)}>{t('archived')}</Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">{t('no_conversations')}</div>}
        {filtered.map(conv => (
          <button key={conv.id} onClick={() => onSelect(conv.id)} className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-smooth cursor-pointer text-start ${activeId === conv.id ? 'bg-primary/5 border-s-2 border-primary' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div>
              {conv.isOnline && <div className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-medium text-sm truncate">{conv.participantName}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(conv.lastMessageTime)}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.participantCompany}</p>
              <div className="flex justify-between items-center mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {conv.isTyping ? <span className="text-primary italic">{t('typing')}...</span> :
                   conv.workflow.conversation_status === 'waiting_for_company' && userRole !== 'company' ?
                     <span className="text-amber-600 italic">{t('workflow_waiting_for_company')}</span> :
                     conv.lastMessage || t('no_messages_yet')
                  }
                </p>
                <div className="flex items-center gap-1">
                  {conv.unreadCount > 0 && <Badge className="text-[10px] h-4 min-w-4 px-1">{conv.unreadCount}</Badge>}
                </div>
              </div>
              <div className="mt-1">
                <WorkflowStatusBadge status={conv.workflow.conversation_status} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatView({
  conversation, messages, onSendMessage, onBack, onArchive, onBlock, onReport, userRole,
  onUpdateStatus
}: {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string, type: Message['type'], fileName?: string, fileSize?: string) => void;
  onBack: () => void;
  onArchive: () => void;
  onBlock: () => void;
  onReport: () => void;
  userRole: string;
  onUpdateStatus: (convId: string, status: ConversationStatus) => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine messaging permissions
  const workflow = conversation.workflow;
  const isClosed = isConversationClosed(workflow);
  const canMessage = userRole === 'company' ? canCompanyMessage(workflow) : canSeekerMessage(workflow);
  const isWaitingForCompany = (workflow.conversation_status === 'waiting_for_company' || workflow.conversation_status === 'new_match') && userRole !== 'company';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, peerTyping]);

  useEffect(() => {
    const unsub = messagingEngine.subscribeTyping(conversation.id, (typing) => {
      setPeerTyping(typing);
    });
    return unsub;
  }, [conversation.id]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!isTyping) {
      setIsTyping(true);
      messagingEngine.emitTyping(conversation.id, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      messagingEngine.emitTyping(conversation.id, false);
    }, 2000);
  };

  const handleSend = () => {
    if (!input.trim() || !canMessage) return;
    onSendMessage(input.trim(), 'text');
    setInput('');
    setIsTyping(false);
    messagingEngine.emitTyping(conversation.id, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleShareCV = () => {
    if (!canMessage) return;
    onSendMessage('', 'cv', 'Ahmed_Hassan_CV_2026.pdf', '2.4 MB');
    setShowAttach(false);
    toast.success(t('cv_shared'));
  };

  const handleShareImage = () => {
    if (!canMessage) return;
    onSendMessage('', 'image', 'portfolio_screenshot.png', '1.2 MB');
    setShowAttach(false);
    toast.success(t('image_shared'));
  };

  const handleShareFile = () => {
    if (!canMessage) return;
    onSendMessage('', 'file', 'project_proposal.pdf', '3.8 MB');
    setShowAttach(false);
    toast.success(t('file_shared'));
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Company-specific actions for hiring workflow
  const handleReject = () => {
    onUpdateStatus(conversation.id, 'rejected');
    setShowMenu(false);
    toast.success(t('workflow_candidate_rejected'));
  };

  const handleCloseConversation = () => {
    onUpdateStatus(conversation.id, 'conversation_closed');
    setShowMenu(false);
    toast.success(t('workflow_conversation_closed_toast'));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden cursor-pointer" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div>
            {conversation.isOnline && <div className="absolute bottom-0 end-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />}
          </div>
          <div>
            <p className="font-medium text-sm">{conversation.participantName}</p>
            <p className="text-xs text-muted-foreground">
              {peerTyping ? <span className="text-primary">{t('typing')}...</span> : conversation.isOnline ? t('online') : t('offline')}
              {conversation.matchScore && <span className="ms-2">· {conversation.matchScore}% {t('match_score')}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WorkflowStatusBadge status={workflow.conversation_status} />
          <div className="relative">
            <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setShowMenu(!showMenu)}><MoreVertical className="w-4 h-4" /></Button>
            {showMenu && (
              <div className="absolute end-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 w-48 py-1">
                <button onClick={() => { onArchive(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"><Archive className="w-4 h-4" />{conversation.isArchived ? t('unarchive') : t('archive_conversation')}</button>
                {userRole === 'company' && !isClosed && (
                  <>
                    <button onClick={handleReject} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer text-destructive"><XCircle className="w-4 h-4" />{t('workflow_reject_candidate')}</button>
                    <button onClick={handleCloseConversation} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer text-amber-600"><Lock className="w-4 h-4" />{t('workflow_close_conversation')}</button>
                  </>
                )}
                <button onClick={() => { onBlock(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer text-destructive"><Ban className="w-4 h-4" />{t('block_user')}</button>
                <button onClick={() => { onReport(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer text-amber-600"><Flag className="w-4 h-4" />{t('report_user')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* System message for closed conversations */}
        {isClosed && (
          <div className="flex justify-center my-4">
            <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {workflow.conversation_status === 'rejected' && t('workflow_closed_by_company')}
                {workflow.conversation_status === 'withdrawn' && t('workflow_closed_by_seeker')}
                {workflow.conversation_status === 'job_closed' && t('workflow_job_closed_message')}
                {workflow.conversation_status === 'conversation_closed' && t('workflow_closed_generic')}
                {workflow.conversation_status === 'blocked' && t('conversation_blocked')}
              </span>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === CURRENT_USER_ID;

          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-muted/50 rounded-full px-4 py-1.5">
                  <p className="text-xs text-muted-foreground">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'order-1' : ''}`}>
                {msg.type === 'text' ? (
                  <div className={`rounded-2xl px-4 py-2.5 ${isMine ? 'bg-primary text-primary-foreground rounded-ee-sm' : 'bg-muted rounded-es-sm'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-2 ${isMine ? 'bg-primary/10 rounded-ee-sm' : 'bg-muted rounded-es-sm'}`}>
                    <FileMessage msg={msg} />
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  {isMine && <MessageStatus status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {peerTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-es-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Controlled by workflow */}
      {isClosed || isWaitingForCompany ? (
        <LockedConversationView workflow={workflow} userRole={userRole} />
      ) : canMessage ? (
        <div className="p-3 border-t border-border bg-background">
          <div className="flex items-end gap-2">
            <div className="relative">
              <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setShowAttach(!showAttach)}><Paperclip className="w-4 h-4" /></Button>
              {showAttach && (
                <div className="absolute bottom-full start-0 mb-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-48 py-1">
                  <button onClick={handleShareCV} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"><FileText className="w-4 h-4 text-primary" />{t('share_cv')}</button>
                  <button onClick={handleShareImage} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"><Image className="w-4 h-4 text-green-600" />{t('share_image')}</button>
                  <button onClick={handleShareFile} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"><Paperclip className="w-4 h-4 text-accent" />{t('share_file')}</button>
                </div>
              )}
            </div>
            <div className="flex-1">
              <Input placeholder={t('type_message')} value={input} onChange={e => handleInputChange(e.target.value)} onKeyDown={handleKeyDown} className="rounded-full" />
            </div>
            <Button size="icon" className="rounded-full cursor-pointer shrink-0" onClick={handleSend} disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      ) : (
        <LockedConversationView workflow={workflow} userRole={userRole} />
      )}
    </div>
  );
}

// ============================================================
// Main Messages Page
// ============================================================

export default function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuthStore();
  const backFallback = userRole === 'company' ? '/company' : userRole === 'admin' ? '/admin' : '/seeker';
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeMessages = activeConvId ? (allMessages[activeConvId] || []) : [];

  // Subscribe to new messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = messagingEngine.subscribe(activeConvId, (msg) => {
      setAllMessages(prev => ({ ...prev, [activeConvId]: [...(prev[activeConvId] || []), msg] }));
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, lastMessage: msg.text || msg.fileName || '', lastMessageTime: msg.timestamp, unreadCount: msg.senderId !== CURRENT_USER_ID ? c.unreadCount + 1 : c.unreadCount } : c));
    });
    return unsub;
  }, [activeConvId]);

  // Subscribe to status changes (realtime simulation)
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = messagingEngine.subscribeStatus(activeConvId, (status) => {
      setConversations(prev => prev.map(c => {
        if (c.id !== activeConvId) return c;
        const updatedWorkflow = { ...c.workflow, conversation_status: status };
        if (isConversationClosed({ ...c.workflow, conversation_status: status })) {
          updatedWorkflow.permissions = { ...updatedWorkflow.permissions, seeker_can_message: false, company_can_message: false };
        }
        return { ...c, workflow: updatedWorkflow };
      }));
    });
    return unsub;
  }, [activeConvId]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (activeConvId) {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c));
      setAllMessages(prev => {
        const msgs = prev[activeConvId];
        if (!msgs) return prev;
        return { ...prev, [activeConvId]: msgs.map(m => m.senderId !== CURRENT_USER_ID ? { ...m, status: 'read' as const } : m) };
      });
    }
  }, [activeConvId]);

  const handleSendMessage = useCallback((text: string, type: Message['type'], fileName?: string, fileSize?: string) => {
    if (!activeConvId || !activeConv) return;

    // Permission check
    const workflow = activeConv.workflow;
    const canSend = userRole === 'company' ? canCompanyMessage(workflow) : canSeekerMessage(workflow);
    if (!canSend) {
      toast.error(t('workflow_cannot_send'));
      return;
    }

    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      timestamp: Date.now(),
      status: 'sent',
      type,
      fileName,
      fileSize,
    };

    setAllMessages(prev => ({ ...prev, [activeConvId]: [...(prev[activeConvId] || []), msg] }));
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConvId) return c;
      const updated = { ...c, lastMessage: text || fileName || '', lastMessageTime: msg.timestamp };

      // If company sends first message, transition workflow
      if (userRole === 'company' && !c.workflow.permissions.company_first_message_sent) {
        updated.workflow = {
          ...c.workflow,
          conversation_status: 'company_contacted',
          application_status: 'company_contacted',
          permissions: {
            ...c.workflow.permissions,
            company_first_message_sent: true,
            seeker_can_message: true,
          },
          first_message_sent_at: new Date().toISOString(),
        };
        toast.success(t('workflow_messaging_unlocked'));
        // Emit realtime status change
        messagingEngine.emitStatusChange(activeConvId, 'company_contacted');
      }

      return updated;
    }));

    messagingEngine.sendMessage(activeConvId, msg);

    // Simulate reply (30% chance, only if conversation is active)
    if (Math.random() > 0.7 && !isConversationClosed(activeConv.workflow)) {
      messagingEngine.simulateReply(activeConvId, activeConv.participantId);
    }

    toast(t('message_sent'), { duration: 1500 });
  }, [activeConvId, activeConv, t, userRole]);

  const handleUpdateStatus = useCallback((convId: string, newStatus: ConversationStatus) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      const isClosed = ['rejected', 'withdrawn', 'job_closed', 'conversation_closed', 'blocked'].includes(newStatus);
      const closedReason = newStatus === 'rejected' ? 'rejected' as const :
                           newStatus === 'withdrawn' ? 'withdrawn' as const :
                           newStatus === 'job_closed' ? 'job_closed' as const :
                           'admin_closed' as const;

      return {
        ...c,
        workflow: {
          ...c.workflow,
          conversation_status: newStatus,
          application_status: newStatus as HiringStage,
          permissions: {
            ...c.workflow.permissions,
            seeker_can_message: !isClosed && c.workflow.permissions.company_first_message_sent,
            company_can_message: !isClosed,
          },
          ...(isClosed ? { closed_reason: closedReason, closed_at: new Date().toISOString(), closed_by: CURRENT_USER_ID } : {}),
        },
      };
    }));

    // Add system message
    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      text: newStatus === 'rejected' ? t('workflow_closed_by_company') :
            newStatus === 'withdrawn' ? t('workflow_closed_by_seeker') :
            newStatus === 'job_closed' ? t('workflow_job_closed_message') :
            t('workflow_closed_generic'),
      timestamp: Date.now(),
      status: 'read',
      type: 'system',
    };
    setAllMessages(prev => ({ ...prev, [convId]: [...(prev[convId] || []), systemMsg] }));

    // Emit realtime
    messagingEngine.emitStatusChange(convId, newStatus);
  }, [t]);

  const handleWithdraw = useCallback(() => {
    if (!activeConvId) return;
    handleUpdateStatus(activeConvId, 'withdrawn');
    toast.success(t('workflow_withdrawn_toast'));
  }, [activeConvId, handleUpdateStatus, t]);

  const handleArchive = useCallback(() => {
    if (!activeConvId) return;
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, isArchived: !c.isArchived } : c));
    toast.success(t('conversation_archived'));
    setActiveConvId(null);
  }, [activeConvId, t]);

  const handleBlock = useCallback(() => {
    if (!activeConvId) return;
    handleUpdateStatus(activeConvId, 'blocked');
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, isBlocked: true } : c));
    toast.success(t('user_blocked'));
  }, [activeConvId, handleUpdateStatus, t]);

  const handleReport = useCallback(() => {
    setShowReportDialog(true);
  }, []);

  const submitReport = () => {
    if (!reportReason.trim()) return;
    toast.success(t('report_submitted'));
    setShowReportDialog(false);
    setReportReason('');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'} flex-col h-screen`}>
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={setActiveConvId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showArchived={showArchived}
          setShowArchived={setShowArchived}
          backFallback={backFallback}
          userRole={userRole || 'job_seeker'}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 ${!activeConvId ? 'hidden md:flex' : 'flex'} flex-col h-screen`}>
        {activeConv ? (
          <ChatView
            conversation={activeConv}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveConvId(null)}
            onArchive={handleArchive}
            onBlock={handleBlock}
            onReport={handleReport}
            userRole={userRole || 'job_seeker'}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('select_conversation')}</h3>
              <p className="text-sm text-muted-foreground">{t('select_conversation_desc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('report_user')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">{t('report_reason_prompt')}</p>
            <Textarea placeholder={t('report_reason_placeholder')} value={reportReason} onChange={e => setReportReason(e.target.value)} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)} className="cursor-pointer">{t('cancel')}</Button>
              <Button onClick={submitReport} className="cursor-pointer" disabled={!reportReason.trim()}>{t('submit_report')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}