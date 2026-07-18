import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BackButton } from '@/components/shared';
import { useAuthStore } from '@/stores';
import {
  billingEngine, generateMockTransactions, generateMockInvoices,
  type PlanConfig, type BillingCycleType, type PaymentProviderType, type Addon, type Promotion,
  type SubscriptionRecord, type UsageRecord, type PaymentTransaction, type InvoiceRecord,
} from '@/services/billing-engine';
import {
  Crown, Check, X, Zap, Building, Rocket, Star, CreditCard, Receipt,
  Tag, Clock, BarChart3, Shield, Users, Briefcase, Eye, MessageSquare,
  Download, Sparkles, Gift, Percent, Search, Heart, FileText, Globe,
  Bookmark, Video, Award, Target, TrendingUp, Package, AlertTriangle,
  Pause, Play, RefreshCw, ChevronRight, Lock, Unlock, Plus, Settings,
  Database, Server, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight,
  Info, Calendar, Wallet, CircleDollarSign, PieChart, Layers
} from 'lucide-react';

// ============================================================
// Plan Card Component (Enhanced with Billing Engine)
// ============================================================

function PlanCard({
  plan, billingCycle, currentPlanId, onSelect, appliedDiscount
}: {
  plan: PlanConfig;
  billingCycle: BillingCycleType;
  currentPlanId: string;
  onSelect: (planId: string) => void;
  appliedDiscount: number;
}) {
  const { t } = useTranslation();
  const isCurrent = currentPlanId === plan.id;
  const price = billingEngine.getEffectiveMonthlyPrice(plan.id, billingCycle);
  const totalPrice = billingEngine.getPlanPrice(plan.id, billingCycle);
  const savings = billingEngine.getSavingsPercentage(plan.id, billingCycle);
  const discountedPrice = appliedDiscount > 0 && price > 0 ? Math.round(price * (1 - appliedDiscount / 100) * 100) / 100 : price;
  const isPopular = plan.metadata?.popular === true;
  const isContactSales = plan.metadata?.contactSales === true;

  const iconMap: Record<number, React.ReactNode> = {
    0: <Zap className="w-5 h-5" />,
    1: <Star className="w-5 h-5" />,
    2: <Crown className="w-5 h-5" />,
    3: <Building className="w-5 h-5" />,
    4: <Rocket className="w-5 h-5" />,
  };
  const colorMap: Record<number, string> = { 0: '#64748B', 1: '#3B82F6', 2: '#8B5CF6', 3: '#F59E0B', 4: '#10B981' };
  const color = colorMap[plan.tier] ?? '#64748B';

  return (
    <Card className={`relative flex flex-col transition-all duration-200 hover:shadow-lg ${isPopular ? 'border-primary shadow-md ring-2 ring-primary/20' : ''} ${isCurrent ? 'border-green-500 bg-green-50/30 dark:bg-green-950/10' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 start-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3">{t('most_popular')}</Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 end-3">
          <Badge className="bg-green-600 text-white px-3">{t('current_plan')}</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {iconMap[plan.tier] ?? <Zap className="w-5 h-5" />}
        </div>
        <CardTitle className="text-lg font-[Poppins]">{plan.name}</CardTitle>
        <CardDescription className="text-xs">{t(plan.description)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-center mb-4">
          {price === 0 ? (
            <div className="text-3xl font-bold font-[Poppins]">{t('free')}</div>
          ) : isContactSales ? (
            <div className="text-xl font-bold font-[Poppins]">{t('custom_pricing')}</div>
          ) : (
            <div>
              {appliedDiscount > 0 && <span className="text-sm text-muted-foreground line-through me-2">${price}</span>}
              <span className="text-3xl font-bold font-[Poppins]">${discountedPrice}</span>
              <span className="text-sm text-muted-foreground">/{t('month')}</span>
              {savings > 0 && <p className="text-xs text-green-600 mt-1">{t('save')} {savings}%</p>}
              {billingCycle !== 'monthly' && totalPrice > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">${totalPrice} {t('billed')} {t(billingCycle)}</p>
              )}
            </div>
          )}
        </div>
        {plan.trialConfig.enabled && !isCurrent && (
          <div className="flex items-center justify-center gap-1 mb-3">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{plan.trialConfig.durationDays} {t('day_free_trial')}</span>
          </div>
        )}
        <ul className="space-y-2">
          {plan.features.slice(0, 8).map((feat) => (
            <li key={feat.featureId} className="flex items-start gap-2 text-xs">
              <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>{t(`feat_${feat.featureId}`, feat.featureName)}</span>
            </li>
          ))}
          {plan.features.length > 8 && (
            <li className="text-xs text-primary font-medium">+{plan.features.length - 8} {t('more_features')}</li>
          )}
        </ul>
        {plan.limits.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-1">
            {plan.limits.slice(0, 4).map(limit => (
              <div key={limit.limitId} className="flex justify-between text-[10px] text-muted-foreground">
                <span>{t(`limit_${limit.limitId}`, limit.limitName)}</span>
                <span className="font-medium">{limit.maxValue === -1 ? '∞' : limit.maxValue}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>{t('current_plan')}</Button>
        ) : isContactSales ? (
          <Button variant="outline" className="w-full cursor-pointer" onClick={() => onSelect(plan.id)}>{t('contact_sales')}</Button>
        ) : (
          <Button className="w-full cursor-pointer" style={{ backgroundColor: color }} onClick={() => onSelect(plan.id)}>
            {price === 0 ? t('get_started') : billingEngine.canUpgrade(currentPlanId, plan.id) ? t('upgrade_now') : t('switch_plan')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ============================================================
// Usage Dashboard
// ============================================================

function UsageDashboard({ planId, role }: { planId: string; role: 'company' | 'job_seeker' }) {
  const { t } = useTranslation();
  const limits = billingEngine.getUsageLimits(planId);

  // Mock current usage
  const mockUsage: Record<string, number> = {
    job_postings: 8, candidate_views: 234, messages_per_day: 45, team_members: 2,
    ai_matches_per_day: 23, cv_downloads: 12, candidate_searches: 67, contact_requests: 18,
    invitations: 22, storage_mb: 340, api_calls: 1200,
    swipes_per_day: 3, profile_views: 45, saved_jobs: 34,
  };

  const usageRecords: UsageRecord[] = limits.map(limit => 
    billingEngine.checkUsage(planId, limit.limitId, mockUsage[limit.limitId] ?? 0)
  );

  const iconMap: Record<string, React.ReactNode> = {
    job_postings: <Briefcase className="w-4 h-4" />,
    candidate_views: <Eye className="w-4 h-4" />,
    messages_per_day: <MessageSquare className="w-4 h-4" />,
    team_members: <Users className="w-4 h-4" />,
    ai_matches_per_day: <Sparkles className="w-4 h-4" />,
    cv_downloads: <Download className="w-4 h-4" />,
    candidate_searches: <Search className="w-4 h-4" />,
    contact_requests: <Heart className="w-4 h-4" />,
    invitations: <FileText className="w-4 h-4" />,
    storage_mb: <Database className="w-4 h-4" />,
    api_calls: <Server className="w-4 h-4" />,
    swipes_per_day: <Heart className="w-4 h-4" />,
    profile_views: <Eye className="w-4 h-4" />,
    saved_jobs: <Bookmark className="w-4 h-4" />,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />{t('usage_tracking')}
        </CardTitle>
        <CardDescription className="text-xs">{t('usage_tracking_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageRecords.map(record => {
          const limit = limits.find(l => l.limitId === record.limitId);
          return (
            <div key={record.limitId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{iconMap[record.limitId] ?? <Activity className="w-4 h-4" />}</span>
                  <span className="text-xs font-medium">{t(`limit_${record.limitId}`, limit?.limitName ?? record.limitId)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${record.isNearLimit ? 'text-amber-600' : record.isAtLimit ? 'text-red-600' : ''}`}>
                    {record.used} / {record.isUnlimited ? '∞' : record.limit}
                  </span>
                  {record.isNearLimit && !record.isAtLimit && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  {record.isAtLimit && <X className="w-3 h-3 text-red-500" />}
                </div>
              </div>
              {!record.isUnlimited && (
                <Progress 
                  value={record.percentage} 
                  className={`h-1.5 ${record.isAtLimit ? '[&>div]:bg-red-500' : record.isNearLimit ? '[&>div]:bg-amber-500' : ''}`} 
                />
              )}
              {record.isUnlimited && <p className="text-[10px] text-green-600">{t('unlimited')}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Add-ons Manager
// ============================================================

function AddonsManager({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const [activeAddons, setActiveAddons] = useState<string[]>(['extra_ai_credits']);
  const availableAddons = billingEngine.getAddons(planId);

  const toggleAddon = (addonId: string) => {
    if (activeAddons.includes(addonId)) {
      setActiveAddons(prev => prev.filter(id => id !== addonId));
      toast.success(t('addon_deactivated'));
    } else {
      setActiveAddons(prev => [...prev, addonId]);
      toast.success(t('addon_activated'));
    }
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    seats: <Users className="w-4 h-4" />,
    exports: <Download className="w-4 h-4" />,
    ai_credits: <Sparkles className="w-4 h-4" />,
    storage: <Database className="w-4 h-4" />,
    analytics: <BarChart3 className="w-4 h-4" />,
    api: <Server className="w-4 h-4" />,
    branding: <Globe className="w-4 h-4" />,
    locations: <Building className="w-4 h-4" />,
    modules: <Package className="w-4 h-4" />,
  };

  if (availableAddons.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('no_addons_available')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('upgrade_for_addons')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />{t('addons')}
        </CardTitle>
        <CardDescription className="text-xs">{t('addons_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableAddons.map(addon => {
          const isActive = activeAddons.includes(addon.id);
          return (
            <div key={addon.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {categoryIcons[addon.category] ?? <Package className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-medium">{addon.name}</p>
                  <p className="text-[10px] text-muted-foreground">{addon.quantity} {addon.unit} · ${addon.pricing.monthly}/{t('month')}</p>
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={() => toggleAddon(addon.id)} />
            </div>
          );
        })}
        {activeAddons.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('addons_total')}</span>
              <span className="font-semibold">
                ${availableAddons.filter(a => activeAddons.includes(a.id)).reduce((sum, a) => sum + a.pricing.monthly, 0).toFixed(2)}/{t('month')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Trial Manager
// ============================================================

function TrialManager({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const trialConfig = billingEngine.getTrialConfig(planId);
  const plan = billingEngine.getPlanById(planId);

  // Mock trial state
  const [isOnTrial] = useState(false);
  const trialDaysRemaining = 5;
  const trialEndDate = new Date(Date.now() + trialDaysRemaining * 86400000).toLocaleDateString();

  if (!trialConfig?.enabled) return null;

  return (
    <Card className={isOnTrial ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/10' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />{t('free_trial')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isOnTrial ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('trial_ends')}</span>
              <span className="text-xs font-medium">{trialEndDate}</span>
            </div>
            <Progress value={((trialConfig.durationDays - trialDaysRemaining) / trialConfig.durationDays) * 100} className="h-2 [&>div]:bg-amber-500" />
            <p className="text-xs text-amber-700">{trialDaysRemaining} {t('days_remaining')}</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 cursor-pointer text-xs">{t('convert_to_paid')}</Button>
              <Button size="sm" variant="outline" className="flex-1 cursor-pointer text-xs text-destructive">{t('cancel_trial')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <Gift className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-800 dark:text-green-200">{plan?.name} — {trialConfig.durationDays} {t('day_free_trial')}</p>
                <p className="text-[10px] text-green-600">{trialConfig.requiresPaymentMethod ? t('payment_method_required') : t('no_payment_required')}</p>
              </div>
            </div>
            <Button size="sm" className="w-full cursor-pointer text-xs">
              <Play className="w-3 h-3 me-1" />{t('start_free_trial')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Current Subscription Info
// ============================================================

function CurrentSubscriptionInfo({ subscription }: { subscription: SubscriptionRecord }) {
  const { t } = useTranslation();
  const plan = billingEngine.getPlanById(subscription.planId);
  const [showManage, setShowManage] = useState(false);

  const statusColors: Record<string, string> = {
    active: 'bg-green-600', trialing: 'bg-amber-500', past_due: 'bg-red-500',
    paused: 'bg-gray-500', canceled: 'bg-red-700', expired: 'bg-gray-700', grace_period: 'bg-amber-600',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />{t('current_subscription')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{subscription.planName}</p>
              <p className="text-[10px] text-muted-foreground">{t(subscription.billingCycle)} · {t('renews')} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
            <Badge className={`text-[10px] text-white ${statusColors[subscription.status] ?? 'bg-gray-500'}`}>
              {t(subscription.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[10px] text-muted-foreground">{t('billing_cycle')}</p>
              <p className="text-xs font-medium">{t(subscription.billingCycle)}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[10px] text-muted-foreground">{t('next_billing_date')}</p>
              <p className="text-xs font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[10px] text-muted-foreground">{t('payment_provider')}</p>
              <p className="text-xs font-medium capitalize">{subscription.paymentProvider}</p>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <p className="text-[10px] text-muted-foreground">{t('active_addons')}</p>
              <p className="text-xs font-medium">{subscription.addons.length}</p>
            </div>
          </div>

          <div className="pt-3 border-t grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer text-xs" onClick={() => setShowManage(true)}>
              <Settings className="w-3 h-3 me-1" />{t('manage')}
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer text-xs text-destructive">
              <X className="w-3 h-3 me-1" />{t('cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showManage} onOpenChange={setShowManage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('manage_subscription')}</DialogTitle>
            <DialogDescription>{t('manage_subscription_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { setShowManage(false); toast.info(t('upgrade_info')); }}>
              <div className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-green-600" /><span className="text-sm">{t('upgrade_plan')}</span></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { setShowManage(false); toast.info(t('downgrade_info')); }}>
              <div className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-amber-600" /><span className="text-sm">{t('downgrade_plan')}</span></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { toast.success(t('subscription_paused')); setShowManage(false); }}>
              <div className="flex items-center gap-2"><Pause className="w-4 h-4 text-gray-600" /><span className="text-sm">{t('pause_subscription')}</span></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { toast.info(t('cycle_changed')); setShowManage(false); }}>
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-600" /><span className="text-sm">{t('change_billing_cycle')}</span></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { setShowManage(false); toast.info(t('payment_method_updated')); }}>
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-purple-600" /><span className="text-sm">{t('update_payment_method')}</span></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// Payment History & Invoices
// ============================================================

function PaymentHistory({ transactions, invoices }: { transactions: PaymentTransaction[]; invoices: InvoiceRecord[] }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'transactions' | 'invoices'>('transactions');

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { completed: 'bg-green-100 text-green-800', paid: 'bg-green-100 text-green-800', pending: 'bg-amber-100 text-amber-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-blue-100 text-blue-800' };
    return <Badge variant="outline" className={`text-[10px] ${colors[status] ?? ''}`}>{t(status)}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />{t('payment_history')}
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant={view === 'transactions' ? 'default' : 'ghost'} className="text-[10px] h-6 cursor-pointer" onClick={() => setView('transactions')}>{t('transactions')}</Button>
            <Button size="sm" variant={view === 'invoices' ? 'default' : 'ghost'} className="text-[10px] h-6 cursor-pointer" onClick={() => setView('invoices')}>{t('invoices')}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'transactions' ? (
          <div className="space-y-2">
            {transactions.map(txn => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{txn.description}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString()} · {txn.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(txn.status)}
                  <span className="text-sm font-semibold">${txn.amount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{inv.number}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(inv.status)}
                  <span className="text-sm font-semibold">${inv.total}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer"><Download className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Payment Method Selector (Enhanced)
// ============================================================

function PaymentMethodSelector({ selected, onSelect, region }: { selected: PaymentProviderType; onSelect: (p: PaymentProviderType) => void; region?: string }) {
  const { t } = useTranslation();
  const providers = billingEngine.getPaymentProviders(region);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />{t('payment_method')}
        </CardTitle>
        <CardDescription className="text-xs">{t('payment_method_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${selected === provider.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
            >
              <span className="text-lg">{provider.icon}</span>
              <div className="text-start">
                <span className="text-xs font-medium block">{provider.name}</span>
                <span className="text-[10px] text-muted-foreground">{provider.supportedCurrencies.join(', ')}</span>
              </div>
              {selected === provider.id && <Check className="w-3.5 h-3.5 text-primary ms-auto" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Coupon & Promotions
// ============================================================

function CouponManager({ onApply }: { onApply: (discount: number) => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<Promotion | null>(null);
  const [error, setError] = useState('');

  const DEMO_PROMOTIONS: Promotion[] = [
    { id: 'p1', code: 'WELCOME50', name: 'Welcome Offer', description: '50% off first month', discountType: 'percentage', discountValue: 50, maxUses: 1000, currentUses: 234, validFrom: '2026-01-01', validUntil: '2026-12-31', applicablePlans: ['company_premium', 'seeker_premium', 'seeker_premium_plus'], applicableCycles: ['monthly', 'quarterly'], isActive: true, isSingleUse: true, metadata: {} },
    { id: 'p2', code: 'SAVE20', name: 'Save 20%', description: '20% off any plan', discountType: 'percentage', discountValue: 20, maxUses: 5000, currentUses: 1200, validFrom: '2026-01-01', validUntil: '2026-12-31', applicablePlans: ['company_premium', 'company_enterprise', 'seeker_premium', 'seeker_premium_plus'], applicableCycles: ['monthly', 'quarterly', 'annual'], isActive: true, isSingleUse: false, metadata: {} },
    { id: 'p3', code: 'FLAT10', name: '$10 Off', description: '$10 off', discountType: 'fixed', discountValue: 10, maxUses: 500, currentUses: 89, validFrom: '2026-01-01', validUntil: '2026-09-30', applicablePlans: ['company_premium', 'seeker_premium'], applicableCycles: ['monthly'], isActive: true, isSingleUse: true, metadata: {} },
    { id: 'p4', code: 'ENTERPRISE30', name: 'Enterprise Launch', description: '30% off Enterprise', discountType: 'percentage', discountValue: 30, maxUses: 100, currentUses: 12, validFrom: '2026-06-01', validUntil: '2026-08-31', applicablePlans: ['company_enterprise'], applicableCycles: ['annual'], isActive: true, isSingleUse: true, metadata: {} },
  ];

  const handleApply = () => {
    setError('');
    const promo = DEMO_PROMOTIONS.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (!promo) { setError(t('invalid_coupon')); return; }
    if (!promo.isActive || new Date(promo.validUntil) < new Date()) { setError(t('coupon_expired')); return; }
    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) { setError(t('coupon_max_uses')); return; }
    setApplied(promo);
    const result = billingEngine.applyPromotion(100, promo);
    onApply(promo.discountValue);
    toast.success(`${t('coupon_applied')}: ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} ${t('off')}`);
  };

  const handleRemove = () => { setApplied(null); setCode(''); onApply(0); };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />{t('promotions_coupons')}</CardTitle>
      </CardHeader>
      <CardContent>
        {applied ? (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{applied.code}</p>
                <p className="text-xs text-green-600">{applied.discountValue}{applied.discountType === 'percentage' ? '%' : '$'} {t('off')} · {t('valid_until')} {new Date(applied.validUntil).toLocaleDateString()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="cursor-pointer text-red-600" onClick={handleRemove}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input placeholder={t('enter_promo_code')} value={code} onChange={e => setCode(e.target.value)} className="flex-1" />
              <Button onClick={handleApply} disabled={!code.trim()} className="cursor-pointer">{t('apply')}</Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-[10px] text-muted-foreground">{t('try_codes')}: WELCOME50, SAVE20, FLAT10, ENTERPRISE30</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Compliance Dashboard
// ============================================================

function ComplianceDashboard() {
  const { t } = useTranslation();
  const compliance = billingEngine.getComplianceConfig();
  const [exportRequested, setExportRequested] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />{t('privacy_compliance')}
        </CardTitle>
        <CardDescription className="text-xs">{t('compliance_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded-lg border text-center ${compliance.gdpr.enabled ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-border'}`}>
            <Globe className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <p className="text-[10px] font-medium">GDPR</p>
            <Badge variant="outline" className="text-[8px] mt-1">{compliance.gdpr.enabled ? t('compliant') : t('n_a')}</Badge>
          </div>
          <div className={`p-2 rounded-lg border text-center ${compliance.ccpa.enabled ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-border'}`}>
            <Shield className="w-4 h-4 mx-auto mb-1 text-blue-600" />
            <p className="text-[10px] font-medium">CCPA</p>
            <Badge variant="outline" className="text-[8px] mt-1">{compliance.ccpa.enabled ? t('compliant') : t('n_a')}</Badge>
          </div>
          <div className={`p-2 rounded-lg border text-center ${compliance.pdpl.enabled ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-border'}`}>
            <Lock className="w-4 h-4 mx-auto mb-1 text-purple-600" />
            <p className="text-[10px] font-medium">PDPL</p>
            <Badge variant="outline" className="text-[8px] mt-1">{compliance.pdpl.enabled ? t('compliant') : t('n_a')}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium">{t('data_rights')}</h4>
          <button className="w-full flex items-center justify-between p-2 rounded border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => { setExportRequested(true); toast.success(t('export_requested')); }}>
            <div className="flex items-center gap-2"><Download className="w-3 h-3" /><span className="text-xs">{t('export_my_data')}</span></div>
            {exportRequested ? <Badge className="text-[8px] bg-amber-500">{t('processing')}</Badge> : <ChevronRight className="w-3 h-3" />}
          </button>
          <button className="w-full flex items-center justify-between p-2 rounded border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => toast.info(t('delete_account_info'))}>
            <div className="flex items-center gap-2 text-destructive"><X className="w-3 h-3" /><span className="text-xs">{t('delete_my_account')}</span></div>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button className="w-full flex items-center justify-between p-2 rounded border hover:bg-muted/50 transition-all cursor-pointer" onClick={() => toast.info(t('consent_info'))}>
            <div className="flex items-center gap-2"><Settings className="w-3 h-3" /><span className="text-xs">{t('manage_consent')}</span></div>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="pt-3 border-t">
          <h4 className="text-xs font-medium mb-2">{t('data_retention')}</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('active_account')}</span><span>{Math.round(compliance.dataRetention.activeAccountDays / 365)} {t('years')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('deleted_account')}</span><span>{compliance.dataRetention.deletedAccountDays} {t('days')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('billing_records')}</span><span>{Math.round(compliance.dataRetention.billingRecordsDays / 365)} {t('years')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('audit_logs')}</span><span>{compliance.dataRetention.auditLogDays} {t('days')}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Checkout Dialog (Enhanced)
// ============================================================

function CheckoutDialog({
  open, onClose, plan, billingCycle, discount, paymentProvider
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanConfig | null;
  billingCycle: BillingCycleType;
  discount: number;
  paymentProvider: PaymentProviderType;
}) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  if (!plan) return null;

  const price = billingEngine.getPlanPrice(plan.id, billingCycle);
  const effectiveMonthly = billingEngine.getEffectiveMonthlyPrice(plan.id, billingCycle);
  const discountedTotal = discount > 0 ? Math.round(price * (1 - discount / 100) * 100) / 100 : price;
  const savings = billingEngine.getSavingsPercentage(plan.id, billingCycle);
  const providers = billingEngine.getPaymentProviders();
  const selectedProvider = providers.find(p => p.id === paymentProvider);

  const handleCheckout = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    toast.success(t('subscription_activated'));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />{t('checkout')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-[10px] text-muted-foreground">{t('billed')} {t(billingCycle)}</p>
              </div>
              <div className="text-end">
                {discount > 0 && <p className="text-xs text-muted-foreground line-through">${price}</p>}
                <p className="text-lg font-bold">${discountedTotal}</p>
              </div>
            </div>
            {savings > 0 && (
              <p className="text-xs text-green-600">{t('save')} {savings}% {t('vs_monthly')}</p>
            )}
            {plan.trialConfig.enabled && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 rounded px-2 py-1">
                <Clock className="w-3 h-3" />
                <span>{plan.trialConfig.durationDays} {t('day_free_trial')} — {t('no_charge_until_trial_ends')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedProvider?.icon}</span>
              <span className="text-sm font-medium">{selectedProvider?.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{t('selected')}</Badge>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-1 text-green-700 dark:text-green-300 text-xs"><Percent className="w-3 h-3" />{t('discount_applied')}</div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">-{discount}%</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">{t('total')}</span>
            <span className="text-xl font-bold">${discountedTotal}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>{t('cancel')}</Button>
            <Button className="flex-1 cursor-pointer" onClick={handleCheckout} disabled={processing}>
              {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : t('confirm_payment')}
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">{t('secure_payment_notice')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Feature Comparison Table
// ============================================================

function FeatureComparisonTable({ plans }: { plans: PlanConfig[] }) {
  const { t } = useTranslation();

  // Collect all unique features across plans
  const allFeatureIds = [...new Set(plans.flatMap(p => p.features.map(f => f.featureId)))];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{t('feature_comparison')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-start py-2 pe-4 font-medium text-muted-foreground">{t('feature')}</th>
              {plans.map(plan => (
                <th key={plan.id} className={`text-center py-2 px-2 font-medium ${plan.metadata?.popular ? 'text-primary' : ''}`}>{plan.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatureIds.map(featureId => (
              <tr key={featureId} className="border-b border-border/50">
                <td className="py-2.5 pe-4 text-muted-foreground">{t(`feat_${featureId}`, featureId.replace(/_/g, ' '))}</td>
                {plans.map(plan => {
                  const hasIt = plan.features.some(f => f.featureId === featureId && f.enabled);
                  return (
                    <td key={plan.id} className={`text-center py-2.5 px-2 ${plan.metadata?.popular ? 'bg-primary/5' : ''}`}>
                      {hasIt ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Subscription Page
// ============================================================

export default function Subscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuthStore();

  const effectiveRole: 'job_seeker' | 'company' = userRole === 'company' ? 'company' : 'job_seeker';
  const backFallback = userRole === 'company' ? '/company' : userRole === 'admin' ? '/admin' : '/seeker';

  // Get plans from billing engine
  const plans = useMemo(() => billingEngine.getPlans(effectiveRole === 'company' ? 'company' : 'job_seeker'), [effectiveRole]);
  const currentPlanId = effectiveRole === 'company' ? 'company_premium' : 'seeker_premium';

  // Mock subscription
  const mockSubscription: SubscriptionRecord = {
    id: 'sub_demo_001', userId: 'user_demo', planId: currentPlanId,
    planName: billingEngine.getPlanById(currentPlanId)?.name ?? 'Premium',
    planType: effectiveRole === 'company' ? 'company' : 'job_seeker',
    status: 'active', billingCycle: 'monthly',
    currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    paymentProvider: 'stripe', addons: [{ addonId: 'extra_ai_credits', quantity: 1, activatedAt: new Date().toISOString() }],
    metadata: {}, createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
  };

  const transactions = useMemo(() => generateMockTransactions(8), []);
  const invoices = useMemo(() => generateMockInvoices(6), []);

  const [billingCycle, setBillingCycle] = useState<BillingCycleType>('annual');
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPayment, setSelectedPayment] = useState<PaymentProviderType>('stripe');
  const [discount, setDiscount] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanConfig | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Block admin from accessing this page directly
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">{t('admin_subscription_redirect')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('admin_subscription_redirect_desc')}</p>
            <Button onClick={() => navigate('/admin')} className="cursor-pointer">{t('go_to_admin')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectPlan = (planId: string) => {
    const plan = billingEngine.getPlanById(planId);
    if (!plan) return;
    if (plan.metadata?.contactSales) { toast.info(t('contact_sales_message')); return; }
    setCheckoutPlan(plan);
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton fallbackRoute={backFallback} />
              <Crown className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold font-[Poppins]">
                  {effectiveRole === 'company' ? t('company_subscription_plans') : t('seeker_subscription_plans')}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {effectiveRole === 'company' ? t('company_subscription_subtitle') : t('seeker_subscription_subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycleType)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('quarterly')} <span className="text-green-600 ms-1">-10%</span></SelectItem>
                  <SelectItem value="semi_annual">{t('semi_annual')} <span className="text-green-600 ms-1">-15%</span></SelectItem>
                  <SelectItem value="annual">{t('annual')} <span className="text-green-600 ms-1">-20%</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="plans">{t('plans')}</TabsTrigger>
            <TabsTrigger value="subscription">{t('my_subscription')}</TabsTrigger>
            <TabsTrigger value="usage">{t('usage')}</TabsTrigger>
            <TabsTrigger value="billing">{t('billing')}</TabsTrigger>
            <TabsTrigger value="addons">{t('addons')}</TabsTrigger>
            <TabsTrigger value="compliance">{t('compliance')}</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-8">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  currentPlanId={currentPlanId}
                  onSelect={handleSelectPlan}
                  appliedDiscount={discount}
                />
              ))}
            </div>
            <FeatureComparisonTable plans={plans} />
          </TabsContent>

          {/* My Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CurrentSubscriptionInfo subscription={mockSubscription} />
              <TrialManager planId={currentPlanId} />
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <UsageDashboard planId={currentPlanId} role={effectiveRole} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentMethodSelector selected={selectedPayment} onSelect={setSelectedPayment} />
              <CouponManager onApply={setDiscount} />
            </div>
            <PaymentHistory transactions={transactions} invoices={invoices} />
          </TabsContent>

          {/* Add-ons Tab */}
          <TabsContent value="addons" className="space-y-6">
            <AddonsManager planId={currentPlanId} />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <ComplianceDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        plan={checkoutPlan}
        billingCycle={billingCycle}
        discount={discount}
        paymentProvider={selectedPayment}
      />
    </div>
  );
}