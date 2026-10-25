import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BackButton } from '@/components/shared';
import { useAuthStore } from '@/stores';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Archive, Settings,
  Heart, Calendar, MessageSquare, FileText, Building, Clock,
  Crown, Megaphone, Mail, Smartphone, Globe, MessageCircle,
  ChevronRight, X, Filter, MoreVertical
} from 'lucide-react';
import {
  useNotifications,
  type Notification,
  type NotificationEvent,
  type NotificationChannel,
  type NotificationPreferences,
  NOTIFICATION_TEMPLATES,
} from '@/lib/notification-center';

// ============================================================
// Icon mapping for notification events
// ============================================================

const EVENT_ICONS: Record<NotificationEvent, React.ReactNode> = {
  new_match: <Heart className="w-4 h-4" />,
  interview: <Calendar className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  application: <FileText className="w-4 h-4" />,
  company_invite: <Building className="w-4 h-4" />,
  job_expiry: <Clock className="w-4 h-4" />,
  subscription: <Crown className="w-4 h-4" />,
  admin_notice: <Megaphone className="w-4 h-4" />,
};

const CHANNEL_ICONS: Record<NotificationChannel, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  push: <Smartphone className="w-4 h-4" />,
  in_app: <Globe className="w-4 h-4" />,
  sms: <MessageCircle className="w-4 h-4" />,
};

const EVENT_LABELS: Record<NotificationEvent, string> = {
  new_match: 'new_match_notif',
  interview: 'interview_notif',
  message: 'message_notif',
  application: 'application_notif',
  company_invite: 'company_invite_notif',
  job_expiry: 'job_expiry_notif',
  subscription: 'subscription_notif',
  admin_notice: 'admin_notice_notif',
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: 'email',
  push: 'push_notifications',
  in_app: 'in_app',
  sms: 'sms',
};

// ============================================================
// Notification Item Component
// ============================================================

function NotificationItem({
  notification, onRead, onArchive, onDelete, onAction
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAction: (url: string) => void;
}) {
  const { t } = useTranslation();
  const template = NOTIFICATION_TEMPLATES[notification.event];
  const isUnread = notification.status === 'unread';

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return t('just_now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('minutes_short')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('hours_short')}`;
    return `${Math.floor(diff / 86400000)}${t('days_short')}`;
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 border-b border-border transition-smooth hover:bg-muted/30 ${isUnread ? 'bg-primary/5' : ''}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${template.color}15`, color: template.color }}>
        {EVENT_ICONS[notification.event]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <button type="button" className="text-start w-full min-h-11" onClick={()=>{onRead(notification.id);if(notification.actionUrl)onAction(notification.actionUrl);}}>
        <div className="flex items-center gap-2">
          <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
          {isUnread && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p></button>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{formatTime(notification.createdAt)}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5" style={{ borderColor: `${template.color}40`, color: template.color }}>
            {t(EVENT_LABELS[notification.event])}
          </Badge>
          {notification.priority === 'urgent' && <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{t('urgent')}</Badge>}
        </div>
        {notification.actionUrl && (
          <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs cursor-pointer" onClick={(e) => { e.stopPropagation(); onAction(notification.actionUrl!); }}>
            {notification.actionLabel || t('view_details')} <ChevronRight className="w-3 h-3 ms-0.5" />
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
        {isUnread && (
          <Button variant="ghost" size="icon" className="h-11 w-11 cursor-pointer" onClick={(e) => { e.stopPropagation(); onRead(notification.id); }} aria-label={t('mark_as_read')}>
            <Check className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-11 w-11 cursor-pointer" onClick={(e) => { e.stopPropagation(); onArchive(notification.id); }} aria-label={t('archive')}>
          <Archive className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11 cursor-pointer text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }} aria-label={t('delete')}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Preferences Panel
// ============================================================

function PreferencesPanel({
  preferences, onSave, busy
}: {
  preferences: NotificationPreferences;
  onSave: (prefs: NotificationPreferences) => Promise<boolean>;
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences>(preferences);
  useEffect(() => { setPrefs(preferences); }, [preferences]);
  const save = async (updated: NotificationPreferences) => { if (busy) return; if (await onSave(updated)) setPrefs(updated); };

  const toggleChannel = (channel: NotificationChannel) => {
    const updated = { ...prefs, channels: { ...prefs.channels, [channel]: !prefs.channels[channel] } };
    void save(updated);
  };

  const toggleEventChannel = (event: NotificationEvent, channel: NotificationChannel) => {
    const current = prefs.events[event];
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    const newPrefs = { ...prefs, events: { ...prefs.events, [event]: updated } };
    void save(newPrefs);
  };

  const toggleQuietHours = () => {
    const updated = { ...prefs, quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled } };
    void save(updated);
  };

  return (
    <div className="space-y-6 p-4">
      <p className="text-sm text-muted-foreground">{i18n.language.startsWith('ar') ? 'إشعارات داخل التطبيق فقط. البريد والدفع والرسائل النصية والساعات الهادئة غير مُعدّة.' : 'In-app notifications are supported. Email, push, SMS delivery and quiet hours are not configured.'}</p>
      {/* Channel Toggles */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t('notification_channels')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(prefs.channels) as NotificationChannel[]).map(channel => (
            <div key={channel} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {CHANNEL_ICONS[channel]}
                <span className="text-sm">{t(CHANNEL_LABELS[channel])}</span>
                {channel !== 'in_app' && <Badge variant="outline" className="text-[10px] h-4">{i18n.language.startsWith('ar')?'غير مُعدّ':'Not configured'}</Badge>}
              </div>
              <Switch disabled={busy || channel !== 'in_app'} checked={prefs.channels[channel]} onCheckedChange={() => toggleChannel(channel)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Event-Channel Matrix */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t('event_preferences')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.keys(prefs.events) as NotificationEvent[]).map(event => (
              <div key={event} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${NOTIFICATION_TEMPLATES[event].color}15`, color: NOTIFICATION_TEMPLATES[event].color }}>
                    {EVENT_ICONS[event]}
                  </div>
                  <span className="text-sm font-medium">{t(EVENT_LABELS[event])}</span>
                </div>
                <div className="flex gap-2 flex-wrap ps-8">
                  {(Object.keys(prefs.channels) as NotificationChannel[]).map(channel => (
                    <Button type="button" size="sm"
                      key={channel}
                      variant={prefs.events[event].includes(channel) ? 'default' : 'outline'}
                      className="text-[10px] min-h-11"
                      onClick={() => toggleEventChannel(event, channel)}
                      disabled={busy || channel !== 'in_app'}
                    >
                      {t(CHANNEL_LABELS[channel])}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">{t('quiet_hours')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">{t('enable_quiet_hours')}</p>
              <p className="text-xs text-muted-foreground">{prefs.quietHours.start} - {prefs.quietHours.end}</p>
            </div>
            <Switch disabled checked={false} onCheckedChange={toggleQuietHours} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Notifications Page
// ============================================================

export default function Notifications() {
  const uid = useAuthStore(s => s.userId);
  return <AccountNotifications key={uid || 'signed-out'} />;
}
function AccountNotifications() {
  const { t,i18n } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuthStore();
  const backFallback = userRole === 'company' ? '/company' : userRole === 'admin' ? '/admin' : '/seeker';
  const {
    notifications, unreadCount, totalCount, preferences, grouped,
    markAsRead, markAllAsRead, archiveNotification, deleteNotification,
    clearAll, updatePreferences, error, loading, busy, refresh, hasMore, loadMore,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [filterEvent, setFilterEvent] = useState<NotificationEvent | 'all'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (n.status === 'archived' || n.status === 'dismissed') return false;
    if (activeTab === 'unread' && n.status !== 'unread') return false;
    if (filterEvent !== 'all' && n.event !== filterEvent) return false;
    return true;
  });

  const handleAction = (url: string) => {
    navigate(url);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center flex-wrap gap-2 justify-between">
            <div className="flex items-center flex-wrap gap-3">
              <BackButton fallbackRoute={backFallback} />
              <Bell className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold font-[Poppins]">{t('notifications')}</h1>
              {unreadCount > 0 && <Badge className="text-xs">{unreadCount} {t('unread')}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="cursor-pointer text-xs" onClick={markAllAsRead}>
                  <CheckCheck className="w-3.5 h-3.5 me-1" />{t('mark_all_read')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {loading && <p className="p-4" role="status">{t('loading')}</p>}
        {error && <div className="p-4 text-destructive" role="alert"><p>{error}</p><Button variant="outline" onClick={() => void refresh()}>{t('try_again')}</Button></div>}
        {hasMore && <Button className="m-4" variant="outline" onClick={loadMore}>{t('load_more', { defaultValue: 'Load more' })}</Button>}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-3 border-b border-border">
            <TabsList className="w-full justify-start flex-wrap bg-transparent p-0 h-auto gap-x-4 gap-y-2">
              <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 px-0">{t('all_notifications')}</TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 px-0">{t('unread')} {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 px-0"><Settings className="w-3.5 h-3.5 me-1" />{t('settings')}</TabsTrigger>
            </TabsList>
          </div>

          {/* Filter bar */}
          {activeTab !== 'settings' && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-border">
              <Button size="sm" variant={filterEvent === 'all' ? 'default' : 'outline'} className="text-xs shrink-0 min-h-11" onClick={() => setFilterEvent('all')}>{t('all')}</Button>
              {(Object.keys(NOTIFICATION_TEMPLATES) as NotificationEvent[]).map(event => (
                <Button size="sm" key={event} variant={filterEvent === event ? 'default' : 'outline'} className="text-xs shrink-0 flex items-center gap-1 min-h-11" onClick={() => setFilterEvent(event)}>
                  {EVENT_ICONS[event]}
                  <span>{t(EVENT_LABELS[event])}</span>
                </Button>
              ))}
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BellOff className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <h3 className="font-semibold text-sm mb-1">{t('no_notifications')}</h3>
                <p className="text-xs text-muted-foreground">{t('no_notifications_desc')}</p>
              </div>
            ) : (
              <div>
                {Object.entries(grouped).map(([group, notifs]) => {
                  const groupNotifs = notifs.filter(n => {
                    if (n.status === 'archived' || n.status === 'dismissed') return false;
                    if (filterEvent !== 'all' && n.event !== filterEvent) return false;
                    return true;
                  });
                  if (groupNotifs.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="px-4 py-2 bg-muted/30">
                        <span className="text-xs font-medium text-muted-foreground uppercase">{t(group)}</span>
                      </div>
                      {groupNotifs.map(notif => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onRead={markAsRead}
                          onArchive={archiveNotification}
                          onDelete={deleteNotification}
                          onAction={handleAction}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Check className="w-12 h-12 text-green-500/20 mb-4" />
                <h3 className="font-semibold text-sm mb-1">{t('all_caught_up')}</h3>
                <p className="text-xs text-muted-foreground">{t('all_caught_up_desc')}</p>
              </div>
            ) : (
              <div>
                {filteredNotifications.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onRead={markAsRead}
                    onArchive={archiveNotification}
                    onDelete={deleteNotification}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            {preferences && <PreferencesPanel preferences={preferences} onSave={updatePreferences} busy={busy} />}
          </TabsContent>
        </Tabs>

        {/* Notification History Summary */}
        {activeTab !== 'settings' && notifications.length > 0 && (
          <div className="p-4 border-t border-border">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t('notification_history')}</p>
                    <p className="text-xs text-muted-foreground">{totalCount} {t('total_notifications')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="cursor-pointer text-xs" onClick={async () => { if (await clearAll()) toast.success(t('notifications_cleared')); }} disabled={busy}>
                    <Trash2 className="w-3.5 h-3.5 me-1" />{t('clear_all')}
                  </Button>
                </div>
                {/* Stats */}
                <p className="text-xs text-muted-foreground mt-3">{i18n.language.startsWith('ar')?'الأرقام التالية للسجلات المحمّلة فقط.':'The following counts cover loaded records only.'}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {(Object.keys(NOTIFICATION_TEMPLATES) as NotificationEvent[]).slice(0, 4).map(event => {
                    const count = notifications.filter(n => n.event === event).length;
                    return (
                      <div key={event} className="text-center p-2 rounded-lg bg-muted/50">
                        <div className="flex justify-center mb-1" style={{ color: NOTIFICATION_TEMPLATES[event].color }}>{EVENT_ICONS[event]}</div>
                        <p className="text-sm font-bold">{count}</p>
                        <p className="text-[10px] text-muted-foreground">{t(EVENT_LABELS[event])}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}