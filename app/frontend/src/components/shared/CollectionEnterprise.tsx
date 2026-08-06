/**
 * Collection Enterprise Features
 * 
 * Enterprise-grade UI components that extend the Universal Collections Engine
 * with realtime sync, sharing, collaboration, activity tracking, analytics,
 * AI insights, automation, and notifications.
 * 
 * These components integrate with CollectionPlatformService and are used
 * within the CollectionDetail view as tabbed panels.
 */

import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreBreakdown } from '@/components/shared/ScoreVisualizationEngine';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Activity, MessageSquare, BarChart3, Brain, Zap, Share2, Bell,
  Users, Clock, TrendingUp, TrendingDown, Minus, Eye, Send,
  CheckCircle2, XCircle, AlertTriangle, Lightbulb, ArrowRight,
  Plus, Trash2, Edit, MoreVertical, RefreshCw, Play, Pause,
  UserPlus, Lock, Globe, Building2, Shield, Star, Sparkles,
  ChevronRight, Filter, Download, Copy, ExternalLink
} from 'lucide-react';
import CollectionPlatformService, {
  type CollectionActivity, type CollectionComment, type CollectionAnalytics,
  type CollectionInsight, type AICollectionSuggestion, type CollectionAutomation,
  type CollectionShareConfig, type CollectionPermission
} from '@/services/CollectionPlatformService';
import type { Collection } from './CollectionEngine';

// ============================================================
// Activity Feed Panel
// ============================================================

interface ActivityFeedProps {
  collectionId: string;
}

export const ActivityFeed = memo(function ActivityFeed({ collectionId }: ActivityFeedProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<CollectionActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      const data = await CollectionPlatformService.getActivities(collectionId);
      setActivities(data);
      setLoading(false);
    };
    loadActivities();

    // Subscribe to realtime updates
    const sub = CollectionPlatformService.subscribeToActivities(collectionId, (activity) => {
      setActivities(prev => [activity, ...prev]);
    });
    return () => sub.unsubscribe();
  }, [collectionId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'entity_added': return <Plus className="w-3 h-3 text-green-600" />;
      case 'entity_removed': return <Trash2 className="w-3 h-3 text-red-500" />;
      case 'entity_moved': return <ArrowRight className="w-3 h-3 text-blue-500" />;
      case 'collection_shared': return <Share2 className="w-3 h-3 text-purple-500" />;
      case 'collection_viewed': return <Eye className="w-3 h-3 text-gray-500" />;
      case 'comment_added': return <MessageSquare className="w-3 h-3 text-blue-500" />;
      case 'rule_modified': return <Edit className="w-3 h-3 text-amber-500" />;
      case 'automation_triggered': return <Zap className="w-3 h-3 text-primary" />;
      case 'collection_created': return <Star className="w-3 h-3 text-amber-500" />;
      default: return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getEventDescription = (activity: CollectionActivity): string => {
    const user = activity.user.name;
    const target = activity.target?.name || '';
    switch (activity.eventType) {
      case 'entity_added': return `${user} added ${target}`;
      case 'entity_removed': return `${user} removed ${target}`;
      case 'entity_moved': return `${user} moved ${target}`;
      case 'collection_shared': return `${user} shared with ${target}`;
      case 'collection_viewed': return `${user} viewed this collection`;
      case 'comment_added': return `${user} commented${target ? ` on ${target}` : ''}`;
      case 'rule_modified': return `${user} modified rules`;
      case 'automation_triggered': return `Automation: ${activity.metadata?.automationName || 'triggered'}`;
      case 'collection_created': return `${user} created this collection`;
      default: return `${user} performed ${activity.eventType}`;
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">{t('loading')}...</div>;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-primary" />{t('activity')}
        </h4>
        <Badge variant="secondary" className="text-[10px]">{activities.length}</Badge>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                {getEventIcon(activity.eventType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs">{getEventDescription(activity)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});

// ============================================================
// Comments Panel
// ============================================================

interface CommentsPanelProps {
  collectionId: string;
  entityId?: string;
}

export const CommentsPanel = memo(function CommentsPanel({ collectionId, entityId }: CommentsPanelProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<CollectionComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComments = async () => {
      const data = await CollectionPlatformService.getComments(collectionId, entityId);
      setComments(data);
      setLoading(false);
    };
    loadComments();

    const sub = CollectionPlatformService.subscribeToComments(collectionId, (comment) => {
      setComments(prev => [...prev, comment]);
    });
    return () => sub.unsubscribe();
  }, [collectionId, entityId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    // Extract mentions (@Name)
    const mentionRegex = /@(\w+\s?\w*)/g;
    const mentions: { id: string; name: string }[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push({ id: `u_${match[1].replace(/\s/g, '_')}`, name: match[1] });
    }

    const comment = await CollectionPlatformService.addComment(
      collectionId, newComment, { id: '1', name: 'Current User' }, entityId, mentions
    );
    setComments(prev => [...prev, comment]);
    setNewComment('');
    toast.success(t('comment_added_success'));
  };

  const handleResolve = async (commentId: string) => {
    await CollectionPlatformService.resolveComment(commentId, { id: '1', name: 'Current User' });
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, isResolved: true, resolvedBy: { id: '1', name: 'Current User' }, resolvedAt: new Date().toISOString() } : c));
    toast.success(t('comment_resolved'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-primary" />{t('comments')}
        </h4>
        <Badge variant="secondary" className="text-[10px]">{comments.filter(c => !c.isResolved).length} {t('open')}</Badge>
      </div>

      <ScrollArea className="h-[240px]">
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className={`p-2.5 rounded-lg border ${comment.isResolved ? 'bg-muted/30 opacity-60' : 'bg-background'}`}>
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {comment.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{comment.author.name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    {comment.isResolved && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  </div>
                  <p className="text-xs mt-1 whitespace-pre-wrap">{comment.content}</p>
                  {comment.mentions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {comment.mentions.map(m => (
                        <Badge key={m.id} variant="secondary" className="text-[9px] h-4 px-1">@{m.name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {!comment.isResolved && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 cursor-pointer" onClick={() => handleResolve(comment.id)}>
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New comment input */}
      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('add_comment_placeholder')}
          className="text-xs h-8"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        />
        <Button size="sm" className="h-8 cursor-pointer" onClick={handleSubmit} disabled={!newComment.trim()}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
});

// ============================================================
// Analytics Panel
// ============================================================

interface AnalyticsPanelProps {
  collectionId: string;
}

export const AnalyticsPanel = memo(function AnalyticsPanel({ collectionId }: AnalyticsPanelProps) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<CollectionAnalytics | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const load = async () => {
      const data = await CollectionPlatformService.getCollectionAnalytics(collectionId, period);
      setAnalytics(data);
    };
    load();
  }, [collectionId, period]);

  if (!analytics) return <div className="p-4 text-center text-sm text-muted-foreground">{t('loading')}...</div>;

  const TrendIcon = ({ direction }: { direction: string }) => {
    if (direction === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (direction === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-primary" />{t('analytics')}
        </h4>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">{t('week')}</SelectItem>
            <SelectItem value="month">{t('month')}</SelectItem>
            <SelectItem value="quarter">{t('quarter')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-primary">{analytics.avgMatchScore}%</p>
          <p className="text-[9px] text-muted-foreground">{t('avg_match')}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{analytics.interviewRate}%</p>
          <p className="text-[9px] text-muted-foreground">{t('interview_rate')}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-green-600">{analytics.hireRate}%</p>
          <p className="text-[9px] text-muted-foreground">{t('hire_rate')}</p>
        </div>
      </div>

      {/* Pipeline Conversion */}
      <div>
        <p className="text-xs font-medium mb-2">{t('pipeline_conversion')}</p>
        <ScoreBreakdown
          items={analytics.pipelineConversion.map(stage => ({
            label: stage.stage,
            value: stage.rate / 100,
          }))}
          layout="auto"
          barSize="md"
          labelSize="xs"
          animated
          showPercentage
        />
      </div>

      {/* Trends */}
      <div>
        <p className="text-xs font-medium mb-2">{t('trends')}</p>
        <div className="space-y-1">
          {analytics.trends.map(trend => (
            <div key={trend.metric} className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50">
              <span className="text-[11px] capitalize">{trend.metric.replace('_', ' ')}</span>
              <div className="flex items-center gap-1">
                <TrendIcon direction={trend.direction} />
                <span className={`text-[10px] ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                  {trend.change > 0 ? '+' : ''}{trend.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Activity */}
      <div>
        <p className="text-xs font-medium mb-2">{t('recruiter_activity')}</p>
        <div className="space-y-1">
          {analytics.recruiterActivity.map(recruiter => (
            <div key={recruiter.userId} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {recruiter.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] flex-1">{recruiter.name}</span>
              <Badge variant="secondary" className="text-[9px] h-4">{recruiter.actions}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================================
// AI Insights Panel
// ============================================================

interface InsightsPanelProps {
  collectionId: string;
}

export const InsightsPanel = memo(function InsightsPanel({ collectionId }: InsightsPanelProps) {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<CollectionInsight[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await CollectionPlatformService.getCollectionInsights(collectionId);
      setInsights(data);
    };
    load();
  }, [collectionId]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'observation': return <Eye className="w-3.5 h-3.5 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
      case 'opportunity': return <Sparkles className="w-3.5 h-3.5 text-green-500" />;
      default: return <Brain className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-primary" />{t('ai_insights')}
        </h4>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] cursor-pointer">
          <RefreshCw className="w-3 h-3 me-1" />{t('refresh')}
        </Button>
      </div>
      <div className="space-y-2">
        {insights.map(insight => (
          <Card key={insight.id} className="border">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{insight.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[9px] h-4">
                      {Math.round(insight.confidence * 100)}% {t('confidence')}
                    </Badge>
                    {insight.actionable && insight.action && (
                      <Button size="sm" variant="outline" className="h-5 text-[9px] px-2 cursor-pointer">
                        {t(insight.action.labelKey)} <ChevronRight className="w-2.5 h-2.5 ms-0.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

// ============================================================
// AI Collection Suggestions
// ============================================================

interface AISuggestionsProps {
  onAccept: (collection: Collection) => void;
}

export const AISuggestions = memo(function AISuggestions({ onAccept }: AISuggestionsProps) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<AICollectionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await CollectionPlatformService.getAICollectionSuggestions('candidate');
      setSuggestions(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAccept = async (suggestion: AICollectionSuggestion) => {
    const collection = await CollectionPlatformService.acceptAISuggestion(suggestion);
    onAccept(collection);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    toast.success(t('ai_collection_created'));
  };

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">{t('loading')}...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-primary" />{t('ai_suggestions')}
        </h4>
        <Badge variant="secondary" className="text-[10px]">{suggestions.length} {t('available')}</Badge>
      </div>
      <div className="space-y-2">
        {suggestions.map(suggestion => (
          <Card key={suggestion.id} className="border hover:shadow-sm transition-all">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{suggestion.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{suggestion.description}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 italic">{suggestion.reasoning}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-[9px] h-4">~{suggestion.estimatedCount} {t('candidates')}</Badge>
                    <Badge variant="secondary" className="text-[9px] h-4">{Math.round(suggestion.confidence * 100)}%</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" className="h-6 text-[10px] px-2 cursor-pointer" onClick={() => handleAccept(suggestion)}>
                    {t('accept')}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 cursor-pointer" onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}>
                    {t('dismiss')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

// ============================================================
// Automation Panel
// ============================================================

interface AutomationPanelProps {
  collectionId?: string;
}

export const AutomationPanel = memo(function AutomationPanel({ collectionId }: AutomationPanelProps) {
  const { t } = useTranslation();
  const [automations, setAutomations] = useState<CollectionAutomation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await CollectionPlatformService.getAutomations(collectionId);
      setAutomations(data);
      setLoading(false);
    };
    load();
  }, [collectionId]);

  const handleToggle = async (automationId: string, isActive: boolean) => {
    await CollectionPlatformService.toggleAutomation(automationId, isActive);
    setAutomations(prev => prev.map(a => a.id === automationId ? { ...a, isActive } : a));
    toast.success(isActive ? t('automation_enabled') : t('automation_disabled'));
  };

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">{t('loading')}...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />{t('automations')}
        </h4>
        <Button size="sm" variant="outline" className="h-6 text-[10px] cursor-pointer">
          <Plus className="w-3 h-3 me-1" />{t('new_automation')}
        </Button>
      </div>
      <div className="space-y-2">
        {automations.map(automation => (
          <Card key={automation.id} className={`border ${!automation.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{automation.name}</p>
                    <Badge variant={automation.isActive ? 'default' : 'secondary'} className="text-[9px] h-4">
                      {automation.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  {automation.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{automation.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Play className="w-2.5 h-2.5" />{automation.executionCount}x
                    </span>
                    {automation.lastExecutedAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{new Date(automation.lastExecutedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={automation.isActive}
                  onCheckedChange={(checked) => handleToggle(automation.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

// ============================================================
// Sharing Panel
// ============================================================

interface SharingPanelProps {
  collectionId: string;
  collection: Collection;
}

export const SharingPanel = memo(function SharingPanel({ collectionId, collection }: SharingPanelProps) {
  const { t } = useTranslation();
  const [shares, setShares] = useState<CollectionShareConfig[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<CollectionPermission>('viewer');

  useEffect(() => {
    const load = async () => {
      const data = await CollectionPlatformService.getCollectionShares(collectionId);
      setShares(data);
    };
    load();
  }, [collectionId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const share = await CollectionPlatformService.shareCollection(collectionId, {
      collectionId,
      sharedWith: { id: `u_${Date.now()}`, name: inviteEmail.split('@')[0], email: inviteEmail, type: 'user' },
      permission: invitePermission,
      sharedBy: { id: '1', name: 'Current User' },
      canReshare: invitePermission === 'editor',
    });
    setShares(prev => [...prev, share]);
    setInviteEmail('');
    setShowInvite(false);
    toast.success(t('collection_shared_success'));
  };

  const handleRevoke = async (shareId: string) => {
    await CollectionPlatformService.revokeShare(shareId);
    setShares(prev => prev.filter(s => s.id !== shareId));
    toast.success(t('share_revoked'));
  };

  const getPermissionIcon = (permission: CollectionPermission) => {
    switch (permission) {
      case 'owner': return <Shield className="w-3 h-3 text-primary" />;
      case 'editor': return <Edit className="w-3 h-3 text-green-500" />;
      case 'contributor': return <Plus className="w-3 h-3 text-blue-500" />;
      case 'viewer': return <Eye className="w-3 h-3 text-gray-500" />;
      case 'read_only': return <Lock className="w-3 h-3 text-gray-400" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  const getVisibilityIcon = () => {
    switch (collection.visibility) {
      case 'private': return <Lock className="w-3 h-3" />;
      case 'team': return <Users className="w-3 h-3" />;
      case 'department': return <Building2 className="w-3 h-3" />;
      case 'organization': return <Globe className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Share2 className="w-4 h-4 text-primary" />{t('sharing')}
        </h4>
        <Button size="sm" variant="outline" className="h-6 text-[10px] cursor-pointer" onClick={() => setShowInvite(true)}>
          <UserPlus className="w-3 h-3 me-1" />{t('invite')}
        </Button>
      </div>

      {/* Visibility badge */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
        {getVisibilityIcon()}
        <span className="text-xs capitalize">{collection.visibility}</span>
        <span className="text-[10px] text-muted-foreground">· {t('owner')}: {collection.owner.name}</span>
      </div>

      {/* Shared with list */}
      <div className="space-y-1.5">
        {shares.map(share => (
          <div key={share.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {share.sharedWith.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{share.sharedWith.name}</p>
              <p className="text-[10px] text-muted-foreground">{share.sharedWith.email}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {getPermissionIcon(share.permission)}
              <span className="text-[10px] capitalize">{share.permission}</span>
            </div>
            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 cursor-pointer" onClick={() => handleRevoke(share.id)}>
              <XCircle className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {/* Invite dialog */}
      {showInvite && (
        <div className="p-3 border rounded-lg space-y-2">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('email_address')}
            className="h-7 text-xs"
          />
          <div className="flex items-center gap-2">
            <Select value={invitePermission} onValueChange={(v) => setInvitePermission(v as CollectionPermission)}>
              <SelectTrigger className="flex-1 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{t('editor')}</SelectItem>
                <SelectItem value="contributor">{t('contributor')}</SelectItem>
                <SelectItem value="viewer">{t('viewer')}</SelectItem>
                <SelectItem value="read_only">{t('read_only')}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs cursor-pointer" onClick={handleInvite}>{t('share')}</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs cursor-pointer" onClick={() => setShowInvite(false)}>{t('cancel')}</Button>
          </div>
        </div>
      )}
    </div>
  );
});

// ============================================================
// Collection Enterprise Sidebar (combines all panels)
// ============================================================

interface CollectionEnterpriseSidebarProps {
  collectionId: string;
  collection: Collection;
  onAcceptAISuggestion: (collection: Collection) => void;
}

export const CollectionEnterpriseSidebar = memo(function CollectionEnterpriseSidebar({
  collectionId, collection, onAcceptAISuggestion
}: CollectionEnterpriseSidebarProps) {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<'activity' | 'comments' | 'analytics' | 'insights' | 'automation' | 'sharing'>('activity');

  const panels = [
    { id: 'activity' as const, icon: Activity, label: 'activity' },
    { id: 'comments' as const, icon: MessageSquare, label: 'comments' },
    { id: 'analytics' as const, icon: BarChart3, label: 'analytics' },
    { id: 'insights' as const, icon: Brain, label: 'insights' },
    { id: 'automation' as const, icon: Zap, label: 'automations' },
    { id: 'sharing' as const, icon: Share2, label: 'sharing' },
  ];

  return (
    <div className="w-full border-s ps-4">
      {/* Panel tabs */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {panels.map(panel => (
          <Button
            key={panel.id}
            size="sm"
            variant={activePanel === panel.id ? 'default' : 'ghost'}
            className="h-7 text-[10px] px-2 cursor-pointer"
            onClick={() => setActivePanel(panel.id)}
          >
            <panel.icon className="w-3 h-3 me-1" />
            {t(panel.label)}
          </Button>
        ))}
      </div>

      {/* Active panel content */}
      {activePanel === 'activity' && <ActivityFeed collectionId={collectionId} />}
      {activePanel === 'comments' && <CommentsPanel collectionId={collectionId} />}
      {activePanel === 'analytics' && <AnalyticsPanel collectionId={collectionId} />}
      {activePanel === 'insights' && <InsightsPanel collectionId={collectionId} />}
      {activePanel === 'automation' && <AutomationPanel collectionId={collectionId} />}
      {activePanel === 'sharing' && <SharingPanel collectionId={collectionId} collection={collection} />}
    </div>
  );
});

export default CollectionEnterpriseSidebar;