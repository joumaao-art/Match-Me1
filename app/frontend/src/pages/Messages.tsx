import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BackButton } from '@/components/shared';
import { useAuthStore } from '@/stores';
import { messageService, type ApplicationConversation, type ApplicationMessage, type ApplicationInterview } from '@/services/message.service';
import { recruitmentLabel } from '@/lib/recruitment-status';
import { ArrowLeft, Calendar, Check, CheckCheck, Lock, MessageSquare, Search, Send } from 'lucide-react';

export default function Messages() {
  const userId = useAuthStore(s => s.userId);
  return userId ? <AccountMessages key={userId} userId={userId} /> : null;
}
function AccountMessages({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const copy = (en: string, arabic: string) => ar ? arabic : en;
  const role = useAuthStore(s => s.userRole);
  const [params, setParams] = useSearchParams();
  const activeId = params.get('conversation');
  const [conversations, setConversations] = useState<ApplicationConversation[]>([]);
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [interviews, setInterviews] = useState<ApplicationInterview[]>([]);
  const [search, setSearch] = useState('');
  const [closedOnly, setClosedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatError, setChatError] = useState('');
  const [limit, setLimit] = useState(50);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [start, setStart] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const alive = useRef(true);
  const currentConversation = useRef(activeId);
  currentConversation.current = activeId;
  const request = useRef<{ conversation: string; content: string; key: string } | null>(null);
  const interviewRequest = useRef<{ payload: string; key: string } | null>(null);
  const listSequence = useRef(0);
  const chatSequence = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const active = conversations.find(c => c.id === activeId);
  const company = active?.company_user_id === userId;
  const canSend = !!active && !active.unavailable && (company || !!active.first_contact_at);
  const valid = useCallback(() => alive.current && useAuthStore.getState().userId === userId, [userId]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const refreshList = useCallback(async () => {
    const sequence = ++listSequence.current;
    try {
      const rows = await messageService.getConversations(userId);
      if (valid() && sequence === listSequence.current) { setConversations(rows); setError(''); }
    } catch (e) { if (valid() && sequence === listSequence.current) setError((e as Error).message); }
    finally { if (valid() && sequence === listSequence.current) setLoading(false); }
  }, [userId, valid]);
  const refreshChat = useCallback(async () => {
    if (!activeId) return;
    const sequence = ++chatSequence.current;
    try {
      const [rows, invitations] = await Promise.all([messageService.getMessages(userId, activeId, limit), messageService.getInterviews(userId, activeId)]);
      if (!valid() || currentConversation.current !== activeId || sequence !== chatSequence.current) return;
      setMessages(rows); setInterviews(invitations); setChatError('');
      if (document.visibilityState === 'visible') {
        await messageService.markAsRead(userId, activeId);
        if (valid() && currentConversation.current === activeId) void refreshList();
      }
    } catch (e) { if (valid() && currentConversation.current === activeId && sequence === chatSequence.current) setChatError((e as Error).message); }
  }, [activeId, limit, userId, valid, refreshList]);
  useEffect(() => {
    void refreshList();
    const onFocus = () => { void refreshList(); };
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshList(); }, 15000);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refreshList]);
  useEffect(() => {
    setScheduleOpen(false);setStart('');setLocation('');setMinutes(60);setMessages([]); setInterviews([]); setInput(''); setLimit(50); setChatError(''); request.current = null; interviewRequest.current = null;
  }, [activeId]);
  useEffect(() => {
    void refreshChat();
    const onFocus = () => { void refreshChat(); };
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refreshChat(); }, 10000);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refreshChat]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [activeId, messages.at(-1)?.id]);
  const select = (id: string | null) => { setParams(id ? { conversation: id } : {}); };
  const send = async () => {
    if (!activeId || !canSend || mutationLock.current || !input.trim()) return;
    mutationLock.current = true;
    const content = input.trim();
    if (request.current?.conversation !== activeId || request.current.content !== content) request.current = { conversation: activeId, content, key: crypto.randomUUID() };
    setBusy(true); setChatError('');
    try {
      await messageService.sendMessage(userId, activeId, content, request.current.key);
      if (valid() && currentConversation.current === activeId) { setInput(''); request.current = null; await Promise.all([refreshList(), refreshChat()]); }
    } catch (e) { if (valid() && currentConversation.current === activeId) setChatError((e as Error).message); }
    finally { mutationLock.current=false; if (valid()) setBusy(false); }
  };
  const mutate = async (operation: () => Promise<unknown>) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    const selected=activeId;
    setBusy(true); setChatError('');
    try { await operation(); if (valid()&&currentConversation.current===selected) await Promise.all([refreshList(), refreshChat()]); }
    catch (e) { if (valid()&&currentConversation.current===selected) setChatError((e as Error).message); }
    finally { mutationLock.current=false; if (valid()) setBusy(false); }
  };
  const schedule = async () => {
    if (!activeId || mutationLock.current) return;
    const date = new Date(start);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now() || !location.trim() || minutes < 15 || minutes > 480) {
      setChatError(copy('Choose a future time, duration of 15–480 minutes, and a location or meeting link.', 'اختر وقتاً مستقبلياً ومدة من 15 إلى 480 دقيقة ومكاناً أو رابط اجتماع.')); return;
    }
    mutationLock.current = true;
    const payload = JSON.stringify([activeId, date.toISOString(), minutes, location.trim()]);
    if (interviewRequest.current?.payload !== payload) interviewRequest.current = { payload, key: crypto.randomUUID() };
    setBusy(true);
    try {
      await messageService.scheduleInterview(userId, activeId, date.toISOString(), minutes, location.trim(), interviewRequest.current.key);
      if (valid() && currentConversation.current === activeId) { setScheduleOpen(false); interviewRequest.current = null; await Promise.all([refreshList(), refreshChat()]); }
    } catch (e) { if (valid() && currentConversation.current === activeId) setChatError((e as Error).message); }
    finally { mutationLock.current=false; if (valid()) setBusy(false); }
  };
  const [visibleConversations,setVisibleConversations]=useState(50);
  const [visibleInterviews,setVisibleInterviews]=useState(20);
  useEffect(()=>{setVisibleConversations(50);},[search,closedOnly]);
  useEffect(()=>{setVisibleInterviews(20);},[activeId]);
  const filtered = conversations.filter(c => (!closedOnly || c.unavailable) && `${c.participant_name} ${c.company_name} ${c.job_title}`.toLowerCase().includes(search.toLowerCase()));
  const status = (c: ApplicationConversation) => recruitmentLabel(c.application_status === 'withdrawn' ? 'withdrawn' : c.company_status || 'pending', i18n.language);
  return <div className="min-h-screen bg-background flex" dir={ar ? 'rtl' : 'ltr'}>
    <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${activeId ? 'hidden md:flex' : 'flex'} flex-col h-[100dvh] border-e border-border`}>
      <div className="p-4 border-b border-border"><div className="flex items-center gap-2 mb-3"><BackButton fallbackRoute={role === 'company' ? '/company' : '/seeker?view=dashboard'} /><h2 className="text-lg font-bold font-[Poppins]">{t('messages')}</h2></div><div className="relative"><Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9 h-9" placeholder={t('search_conversations')} value={search} onChange={e => setSearch(e.target.value)} /></div><div className="flex gap-2 mt-3"><Button size="sm" variant={!closedOnly ? 'default' : 'outline'} onClick={() => setClosedOnly(false)}>{t('all')}</Button><Button size="sm" variant={closedOnly ? 'default' : 'outline'} onClick={() => setClosedOnly(true)}>{copy('Closed', 'مغلقة')}</Button></div></div>
      <div className="flex-1 overflow-y-auto">{loading && <p className="p-4" role="status">{t('loading')}</p>}{error && <div className="p-4" role="alert"><p>{error}</p><Button onClick={() => void refreshList()}>{t('try_again')}</Button></div>}{!loading && !error && !filtered.length && <p className="p-8 text-center text-sm text-muted-foreground">{t('no_conversations')}</p>}{filtered.slice(0,visibleConversations).map(c => <button key={c.id} onClick={() => select(c.id)} className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-start ${activeId === c.id ? 'bg-primary/5 border-s-2 border-primary' : ''}`}><div className="w-11 h-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{c.participant_name}</p><p className="text-xs text-muted-foreground truncate">{c.job_title}</p><div className="flex gap-2 justify-between"><p className="text-xs text-muted-foreground truncate">{c.last_message || t('no_messages_yet')}</p>{c.unread_count > 0 && <Badge>{c.unread_count}</Badge>}</div><Badge variant="outline" className="mt-1 text-[10px]">{status(c)}</Badge></div></button>)}{filtered.length>visibleConversations&&<Button variant="outline" className="m-3" onClick={()=>setVisibleConversations(n=>n+50)}>{copy('Load more conversations','تحميل المزيد من المحادثات')}</Button>}</div>
    </div>
    <div className={`flex-1 min-w-0 ${!activeId ? 'hidden md:flex' : 'flex'} flex-col h-[100dvh]`}>
      {active ? <><div className="flex items-center justify-between gap-2 p-3 border-b border-border"><div className="flex items-center gap-3 min-w-0"><Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label={t('back')} onClick={() => select(null)}><ArrowLeft className="w-5 h-5" /></Button><div className="min-w-0"><p className="font-medium text-sm truncate">{active.participant_name}</p><p className="text-xs text-muted-foreground truncate">{active.job_title}</p></div></div><div className="flex flex-wrap justify-end gap-2"><Badge variant="outline">{status(active)}</Badge>{!active.unavailable && <Button variant="outline" size="sm" disabled={busy} onClick={() => { if (window.confirm(copy('Close this conversation permanently?', 'إغلاق هذه المحادثة نهائياً؟'))) void mutate(() => messageService.closeConversation(userId, active.id)); }}><Lock className="w-4 h-4" /><span className="sr-only">{copy('Close conversation', 'إغلاق المحادثة')}</span></Button>}{company && canSend && !!active.first_contact_at && <Button size="sm" onClick={() => { setChatError(''); setScheduleOpen(true); }}><Calendar className="w-4 h-4" /><span className="sr-only">{copy('Schedule interview', 'جدولة مقابلة')}</span></Button>}</div></div>
      {chatError && <div role="alert" className="p-3 text-sm text-destructive"><p>{chatError}</p><Button variant="outline" onClick={() => void refreshChat()}>{t('try_again')}</Button></div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">{messages.length >= limit && <Button variant="outline" onClick={() => setLimit(n => n + 50)}>{copy('Load older messages', 'تحميل الرسائل السابقة')}</Button>}{interviews.slice(0,visibleInterviews).map(i => <div key={i.id} className="rounded-lg border p-3 space-y-2"><p className="font-medium text-sm">{copy('Interview', 'مقابلة')} · {new Date(i.starts_at).toLocaleString(i18n.language)}</p><p className="text-sm break-words">{i.location} · {i.duration_minutes} {copy('minutes', 'دقيقة')} · {t(i.status, { defaultValue: i.status })}</p><div className="flex flex-wrap gap-2">{!company && i.status === 'invited' && !active.unavailable && new Date(i.starts_at).getTime() > Date.now() && <><Button size="sm" disabled={busy} onClick={() => void mutate(() => messageService.respondInterview(userId, i.id, 'accepted'))}>{copy('Accept', 'قبول')}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => messageService.respondInterview(userId, i.id, 'declined'))}>{copy('Decline', 'رفض')}</Button></>}{company && ['invited', 'accepted'].includes(i.status) && <Button size="sm" variant="outline" disabled={busy} onClick={() => void mutate(() => messageService.respondInterview(userId, i.id, 'cancelled'))}>{t('cancel')}</Button>}</div></div>)}{interviews.length>visibleInterviews&&<Button variant="outline" onClick={()=>setVisibleInterviews(n=>n+20)}>{copy('Load more interviews','تحميل المزيد من المقابلات')}</Button>}{messages.map(m => { const mine = m.sender_id === userId; return <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className="max-w-[75%] min-w-0"><div className={`rounded-2xl px-4 py-2.5 ${mine ? 'bg-primary text-primary-foreground rounded-ee-sm' : 'bg-muted rounded-es-sm'}`}><p className="text-sm whitespace-pre-wrap break-words">{m.content}</p></div><div className={`flex items-center gap-1 mt-0.5 ${mine ? 'justify-end' : ''}`}><span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString(i18n.language)}</span>{mine && (m.read_at ? <CheckCheck aria-label={t('read')} className="w-3 h-3 text-primary" /> : <Check aria-label={t('sent')} className="w-3 h-3 text-muted-foreground" />)}</div></div></div>; })}<div ref={endRef} /></div>
      {canSend ? <form className="p-3 border-t border-border bg-background pb-[max(12px,env(safe-area-inset-bottom))]" onSubmit={e => { e.preventDefault(); void send(); }}><div className="flex items-end gap-2"><Input className="rounded-full" maxLength={5000} value={input} disabled={busy} placeholder={t('type_message')} onChange={e => setInput(e.target.value)} /><Button size="icon" className="rounded-full shrink-0" type="submit" disabled={busy || !input.trim()} aria-label={t('send_message')}><Send className="w-4 h-4" /></Button></div></form> : <div className="p-4 border-t text-sm text-muted-foreground text-center">{active.unavailable ? copy('This conversation is closed. Its history remains available.', 'هذه المحادثة مغلقة. يبقى سجلها متاحاً.') : t('workflow_waiting_message')}</div>}
      </> : <div className="flex-1 flex items-center justify-center p-4 text-center"><div><MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" /><h3 className="text-lg font-semibold">{activeId ? copy('Conversation unavailable', 'المحادثة غير متاحة') : t('select_conversation')}</h3><p className="text-sm text-muted-foreground">{t('select_conversation_desc')}</p>{activeId && <Button className="mt-3 md:hidden" onClick={() => select(null)}>{t('back')}</Button>}</div></div>}
    </div>
    <Dialog open={scheduleOpen} onOpenChange={open => { if (!busy) setScheduleOpen(open); }}><DialogContent><DialogHeader><DialogTitle>{copy('Schedule interview', 'جدولة مقابلة')}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={e => { e.preventDefault(); void schedule(); }}><label className="block text-sm">{copy('Date and time (your local timezone)', 'التاريخ والوقت (منطقتك الزمنية المحلية)')}<Input type="datetime-local" required value={start} disabled={busy} onChange={e => setStart(e.target.value)} /></label><label className="block text-sm">{copy('Duration in minutes', 'المدة بالدقائق')}<Input type="number" min={15} max={480} required value={minutes} disabled={busy} onChange={e => setMinutes(Number(e.target.value))} /></label><label className="block text-sm">{copy('Location or meeting link', 'مكان أو رابط الاجتماع')}<Input required maxLength={500} value={location} disabled={busy} onChange={e => setLocation(e.target.value)} /></label>{chatError && <p role="alert" className="text-destructive text-sm">{chatError}</p>}<Button type="submit" disabled={busy}>{copy('Send invitation', 'إرسال دعوة')}</Button></form></DialogContent></Dialog>
  </div>;
}
