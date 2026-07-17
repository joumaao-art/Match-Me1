// ============================================================
// Notification Center - Complete notification system
// Channels: Email, Push, In-app, SMS-ready
// Events: New Match, Interview, Message, Application, Company Invite,
//         Job Expiry, Subscription, Admin Notice
// ============================================================

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';

export type NotificationEvent =
  | 'new_match'
  | 'interview'
  | 'message'
  | 'application'
  | 'company_invite'
  | 'job_expiry'
  | 'subscription'
  | 'admin_notice';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';

export interface Notification {
  id: string;
  userId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  title: string;
  body: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: number;
  readAt?: number;
  expiresAt?: number;
  groupId?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  events: Record<NotificationEvent, NotificationChannel[]>;
  quietHours: { enabled: boolean; start: string; end: string };
  frequency: 'instant' | 'hourly' | 'daily';
}

export interface NotificationTemplate {
  event: NotificationEvent;
  titleTemplate: string;
  bodyTemplate: string;
  icon: string;
  color: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
}

// ============================================================
// Notification Templates
// ============================================================

export const NOTIFICATION_TEMPLATES: Record<NotificationEvent, NotificationTemplate> = {
  new_match: {
    event: 'new_match',
    titleTemplate: '🎉 New Match!',
    bodyTemplate: 'You matched with {{name}} from {{company}}! Start a conversation now.',
    icon: 'heart',
    color: '#EC4899',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'push', 'email'],
  },
  interview: {
    event: 'interview',
    titleTemplate: '📅 Interview Scheduled',
    bodyTemplate: '{{company}} has scheduled an interview with you on {{date}} at {{time}}.',
    icon: 'calendar',
    color: '#8B5CF6',
    defaultPriority: 'urgent',
    defaultChannels: ['in_app', 'push', 'email', 'sms'],
  },
  message: {
    event: 'message',
    titleTemplate: '💬 New Message',
    bodyTemplate: '{{sender}} sent you a message: "{{preview}}"',
    icon: 'message-square',
    color: '#3B82F6',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'push'],
  },
  application: {
    event: 'application',
    titleTemplate: '📋 Application Update',
    bodyTemplate: 'Your application for {{position}} at {{company}} has been {{status}}.',
    icon: 'file-text',
    color: '#10B981',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'push', 'email'],
  },
  company_invite: {
    event: 'company_invite',
    titleTemplate: '🏢 Company Invitation',
    bodyTemplate: '{{company}} has invited you to apply for {{position}}.',
    icon: 'building',
    color: '#F59E0B',
    defaultPriority: 'high',
    defaultChannels: ['in_app', 'push', 'email'],
  },
  job_expiry: {
    event: 'job_expiry',
    titleTemplate: '⏰ Job Expiring Soon',
    bodyTemplate: 'The {{position}} position at {{company}} expires in {{days}} days. Apply now!',
    icon: 'clock',
    color: '#EF4444',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'push'],
  },
  subscription: {
    event: 'subscription',
    titleTemplate: '💎 Subscription Update',
    bodyTemplate: '{{message}}',
    icon: 'crown',
    color: '#6366F1',
    defaultPriority: 'medium',
    defaultChannels: ['in_app', 'email'],
  },
  admin_notice: {
    event: 'admin_notice',
    titleTemplate: '📢 Platform Notice',
    bodyTemplate: '{{message}}',
    icon: 'megaphone',
    color: '#64748B',
    defaultPriority: 'low',
    defaultChannels: ['in_app'],
  },
};

// ============================================================
// Notification Center Engine
// ============================================================

type NotificationListener = (notification: Notification) => void;
type UnreadCountListener = (count: number) => void;

class NotificationCenterEngine {
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences | null = null;
  private listeners: NotificationListener[] = [];
  private unreadListeners: UnreadCountListener[] = [];
  private userId: string = '';

  initialize(userId: string) {
    this.userId = userId;
    this.loadFromStorage();
    this.loadPreferences();
    this.startRealtimeSubscription();
  }

  // ---- Storage ----

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(`notifications_${this.userId}`);
      if (stored) {
        this.notifications = JSON.parse(stored);
        // Remove expired notifications
        const now = Date.now();
        this.notifications = this.notifications.filter(n => !n.expiresAt || n.expiresAt > now);
      }
    } catch { /* ignore */ }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(`notifications_${this.userId}`, JSON.stringify(this.notifications));
    } catch { /* ignore */ }
  }

  private loadPreferences() {
    try {
      const stored = localStorage.getItem(`notification_prefs_${this.userId}`);
      if (stored) {
        this.preferences = JSON.parse(stored);
      } else {
        this.preferences = this.getDefaultPreferences();
      }
    } catch {
      this.preferences = this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      userId: this.userId,
      channels: { email: true, push: true, in_app: true, sms: false },
      events: {
        new_match: ['in_app', 'push', 'email'],
        interview: ['in_app', 'push', 'email', 'sms'],
        message: ['in_app', 'push'],
        application: ['in_app', 'push', 'email'],
        company_invite: ['in_app', 'push', 'email'],
        job_expiry: ['in_app', 'push'],
        subscription: ['in_app', 'email'],
        admin_notice: ['in_app'],
      },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      frequency: 'instant',
    };
  }

  savePreferences(prefs: NotificationPreferences) {
    this.preferences = prefs;
    localStorage.setItem(`notification_prefs_${this.userId}`, JSON.stringify(prefs));
  }

  getPreferences(): NotificationPreferences {
    return this.preferences || this.getDefaultPreferences();
  }

  // ---- Realtime Subscription (simulated) ----

  private realtimeInterval: ReturnType<typeof setInterval> | null = null;

  private startRealtimeSubscription() {
    // In production, this would be a Supabase Realtime subscription
    // Simulating periodic check for new notifications
    this.realtimeInterval = setInterval(() => {
      // Check for any pending notifications from the server
      this.checkForNewNotifications();
    }, 30000); // Check every 30 seconds
  }

  private checkForNewNotifications() {
    // In production: fetch from Supabase where status = 'unread' and created_at > last_check
    // Simulated - no-op in demo
  }

  stopRealtimeSubscription() {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
    }
  }

  // ---- Core Operations ----

  createNotification(
    event: NotificationEvent,
    data: Record<string, string>,
    overrides?: Partial<Notification>
  ): Notification[] {
    const template = NOTIFICATION_TEMPLATES[event];
    const prefs = this.getPreferences();
    const enabledChannels = prefs.events[event].filter(ch => prefs.channels[ch]);

    // Check quiet hours
    if (prefs.quietHours.enabled && this.isQuietHours()) {
      // During quiet hours, only deliver in_app (silently)
      const filtered = enabledChannels.filter(ch => ch === 'in_app');
      if (filtered.length === 0) return [];
    }

    const title = this.interpolate(template.titleTemplate, data);
    const body = this.interpolate(template.bodyTemplate, data);

    const notifications: Notification[] = enabledChannels.map(channel => {
      const notification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: this.userId,
        event,
        channel,
        title,
        body,
        priority: template.defaultPriority,
        status: 'unread',
        metadata: data,
        createdAt: Date.now(),
        ...overrides,
      };
      return notification;
    });

    // Store in-app notifications
    const inAppNotifs = notifications.filter(n => n.channel === 'in_app');
    this.notifications = [...inAppNotifs, ...this.notifications];
    this.saveToStorage();

    // Dispatch to channels
    notifications.forEach(n => {
      this.dispatchToChannel(n);
      this.listeners.forEach(l => l(n));
    });

    this.notifyUnreadCount();
    return notifications;
  }

  private dispatchToChannel(notification: Notification) {
    switch (notification.channel) {
      case 'in_app':
        // Already stored, UI will pick it up
        break;
      case 'push':
        this.sendPushNotification(notification);
        break;
      case 'email':
        this.sendEmailNotification(notification);
        break;
      case 'sms':
        this.sendSMSNotification(notification);
        break;
    }
  }

  private sendPushNotification(notification: Notification) {
    // In production: call Push API (Firebase FCM / OneSignal / etc.)
    if ('Notification' in window && Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
    console.log('[Push]', notification.title, notification.body);
  }

  private sendEmailNotification(notification: Notification) {
    // In production: call Supabase Edge Function to send email via SendGrid/Resend
    console.log('[Email]', notification.title, notification.body);
  }

  private sendSMSNotification(notification: Notification) {
    // SMS-ready: In production, call Twilio/MessageBird API via Edge Function
    console.log('[SMS Ready]', notification.title, notification.body);
  }

  // ---- Query Operations ----

  getAll(filter?: { event?: NotificationEvent; status?: NotificationStatus; limit?: number }): Notification[] {
    let result = [...this.notifications];
    if (filter?.event) result = result.filter(n => n.event === filter.event);
    if (filter?.status) result = result.filter(n => n.status === filter.status);
    if (filter?.limit) result = result.slice(0, filter.limit);
    return result;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => n.status === 'unread').length;
  }

  getGrouped(): Record<string, Notification[]> {
    const groups: Record<string, Notification[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const n of this.notifications) {
      let group: string;
      if (n.createdAt >= today.getTime()) group = 'today';
      else if (n.createdAt >= yesterday.getTime()) group = 'yesterday';
      else if (n.createdAt >= weekAgo.getTime()) group = 'this_week';
      else group = 'older';

      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }

  // ---- Mutation Operations ----

  markAsRead(notificationId: string) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.status = 'read';
      notif.readAt = Date.now();
      this.saveToStorage();
      this.notifyUnreadCount();
    }
  }

  markAllAsRead() {
    const now = Date.now();
    this.notifications.forEach(n => {
      if (n.status === 'unread') {
        n.status = 'read';
        n.readAt = now;
      }
    });
    this.saveToStorage();
    this.notifyUnreadCount();
  }

  archive(notificationId: string) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.status = 'archived';
      this.saveToStorage();
      this.notifyUnreadCount();
    }
  }

  dismiss(notificationId: string) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.status = 'dismissed';
      this.saveToStorage();
      this.notifyUnreadCount();
    }
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToStorage();
    this.notifyUnreadCount();
  }

  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyUnreadCount();
  }

  // ---- Listeners ----

  onNotification(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => { const idx = this.listeners.indexOf(listener); if (idx > -1) this.listeners.splice(idx, 1); };
  }

  onUnreadCountChange(listener: UnreadCountListener): () => void {
    this.unreadListeners.push(listener);
    return () => { const idx = this.unreadListeners.indexOf(listener); if (idx > -1) this.unreadListeners.splice(idx, 1); };
  }

  private notifyUnreadCount() {
    const count = this.getUnreadCount();
    this.unreadListeners.forEach(l => l(count));
  }

  // ---- Utilities ----

  private interpolate(template: string, data: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  private isQuietHours(): boolean {
    if (!this.preferences?.quietHours.enabled) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = this.preferences.quietHours.start.split(':').map(Number);
    const [endH, endM] = this.preferences.quietHours.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  // ---- Push Permission ----

  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  // ---- Demo: Seed sample notifications ----

  seedDemoNotifications() {
    const demoNotifs: Array<{ event: NotificationEvent; data: Record<string, string>; overrides?: Partial<Notification> }> = [
      { event: 'new_match', data: { name: 'Fatima Al-Zahra', company: 'TechCorp' }, overrides: { createdAt: Date.now() - 300000, actionUrl: '/messages' } },
      { event: 'interview', data: { company: 'DataFlow', date: 'July 20, 2026', time: '2:00 PM' }, overrides: { createdAt: Date.now() - 1800000, actionUrl: '/job-seeker?tab=applications' } },
      { event: 'message', data: { sender: 'Mohammed Ali', preview: 'Can you share your portfolio?' }, overrides: { createdAt: Date.now() - 3600000, actionUrl: '/messages' } },
      { event: 'application', data: { position: 'Senior Frontend Developer', company: 'CloudNine', status: 'shortlisted' }, overrides: { createdAt: Date.now() - 7200000, actionUrl: '/job-seeker?tab=applications' } },
      { event: 'company_invite', data: { company: 'FinanceHub', position: 'Lead Engineer' }, overrides: { createdAt: Date.now() - 14400000, actionUrl: '/job-seeker?tab=discover' } },
      { event: 'job_expiry', data: { position: 'React Developer', company: 'StartupX', days: '2' }, overrides: { createdAt: Date.now() - 43200000, actionUrl: '/job-seeker?tab=saved' } },
      { event: 'subscription', data: { message: 'Your Premium plan renews in 3 days.' }, overrides: { createdAt: Date.now() - 86400000, actionUrl: '/subscription' } },
      { event: 'admin_notice', data: { message: 'Platform maintenance scheduled for July 22, 2026 at 3:00 AM UTC.' }, overrides: { createdAt: Date.now() - 172800000 } },
    ];

    // Only seed if no notifications exist
    if (this.notifications.length === 0) {
      demoNotifs.forEach(({ event, data, overrides }) => {
        const template = NOTIFICATION_TEMPLATES[event];
        const title = this.interpolate(template.titleTemplate, data);
        const body = this.interpolate(template.bodyTemplate, data);
        const notification: Notification = {
          id: `notif-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: this.userId,
          event,
          channel: 'in_app',
          title,
          body,
          priority: template.defaultPriority,
          status: 'unread',
          metadata: data,
          createdAt: overrides?.createdAt || Date.now(),
          ...overrides,
        };
        this.notifications.push(notification);
      });
      this.saveToStorage();
      this.notifyUnreadCount();
    }
  }
}

// Singleton instance
export const notificationCenter = new NotificationCenterEngine();

// ============================================================
// React Hook
// ============================================================

import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    // Initialize with current user
    notificationCenter.initialize('current-user');
    notificationCenter.seedDemoNotifications();

    setNotifications(notificationCenter.getAll());
    setUnreadCount(notificationCenter.getUnreadCount());
    setPreferences(notificationCenter.getPreferences());

    const unsubNotif = notificationCenter.onNotification(() => {
      setNotifications(notificationCenter.getAll());
    });

    const unsubCount = notificationCenter.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    return () => { unsubNotif(); unsubCount(); notificationCenter.stopRealtimeSubscription(); };
  }, []);

  const markAsRead = useCallback((id: string) => {
    notificationCenter.markAsRead(id);
    setNotifications(notificationCenter.getAll());
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationCenter.markAllAsRead();
    setNotifications(notificationCenter.getAll());
  }, []);

  const archiveNotification = useCallback((id: string) => {
    notificationCenter.archive(id);
    setNotifications(notificationCenter.getAll());
  }, []);

  const dismissNotification = useCallback((id: string) => {
    notificationCenter.dismiss(id);
    setNotifications(notificationCenter.getAll());
  }, []);

  const deleteNotification = useCallback((id: string) => {
    notificationCenter.deleteNotification(id);
    setNotifications(notificationCenter.getAll());
  }, []);

  const clearAll = useCallback(() => {
    notificationCenter.clearAll();
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((prefs: NotificationPreferences) => {
    notificationCenter.savePreferences(prefs);
    setPreferences(prefs);
  }, []);

  const triggerNotification = useCallback((event: NotificationEvent, data: Record<string, string>, overrides?: Partial<Notification>) => {
    notificationCenter.createNotification(event, data, overrides);
    setNotifications(notificationCenter.getAll());
  }, []);

  const requestPushPermission = useCallback(async () => {
    return notificationCenter.requestPushPermission();
  }, []);

  return {
    notifications,
    unreadCount,
    preferences,
    grouped: notificationCenter.getGrouped(),
    markAsRead,
    markAllAsRead,
    archiveNotification,
    dismissNotification,
    deleteNotification,
    clearAll,
    updatePreferences,
    triggerNotification,
    requestPushPermission,
    pushPermissionStatus: notificationCenter.getPushPermissionStatus(),
  };
}