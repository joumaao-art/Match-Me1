import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/App';
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, Users, Building2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: 'company' | 'job_seeker';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

const mockConversations: Conversation[] = [
  { id: '1', name: 'TechCorp', role: 'company', lastMessage: 'We would love to schedule an interview!', timestamp: '2:30 PM', unread: 2, online: true },
  { id: '2', name: 'DataFlow', role: 'company', lastMessage: 'Thank you for your application.', timestamp: '11:00 AM', unread: 0, online: false },
  { id: '3', name: 'Ahmed Hassan', role: 'job_seeker', lastMessage: 'I am available for the interview next week.', timestamp: 'Yesterday', unread: 1, online: true },
];

const mockMessages: ChatMessage[] = [
  { id: '1', content: 'Hi! We reviewed your profile and are very impressed with your experience.', sender: 'other', timestamp: '2:15 PM', read: true },
  { id: '2', content: 'Thank you! I am very interested in the Senior Frontend Developer position.', sender: 'me', timestamp: '2:20 PM', read: true },
  { id: '3', content: 'Great! We would love to schedule an interview. Are you available next week?', sender: 'other', timestamp: '2:25 PM', read: true },
  { id: '4', content: 'Yes, I am available on Tuesday and Wednesday. What time works best?', sender: 'me', timestamp: '2:28 PM', read: true },
  { id: '5', content: 'We would love to schedule an interview!', sender: 'other', timestamp: '2:30 PM', read: false },
];

export default function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(userRole === 'company' ? '/company' : '/seeker')} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold font-[Poppins]">{t('messages')}</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-e border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3">
            <Input placeholder={t('search_conversations')} className="h-9" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-smooth cursor-pointer ${
                  selectedConversation?.id === conv.id ? 'bg-muted/50' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {conv.role === 'company' ? (
                      <Building2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Users className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm truncate">{conv.name}</p>
                    <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {conv.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Button variant="ghost" size="icon" className="md:hidden cursor-pointer" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedConversation.role === 'company' ? (
                    <Building2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Users className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedConversation.name}</p>
                  <p className="text-xs text-green-600">{selectedConversation.online ? t('online') : t('offline')}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.sender === 'me'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {msg.timestamp}
                        </span>
                        {msg.sender === 'me' && (
                          msg.read ? <CheckCheck className="w-3 h-3 text-primary-foreground/70" /> : <Check className="w-3 h-3 text-primary-foreground/70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="cursor-pointer shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={t('type_message')}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()} className="cursor-pointer shrink-0" aria-label={t('send')}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">{t('no_messages_desc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}