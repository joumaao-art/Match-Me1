/**
 * BillingAnalytics - Admin Billing Analytics Dashboard
 * 
 * Provides comprehensive billing analytics including:
 * - MRR/ARR tracking
 * - Subscriber metrics
 * - Trial conversions
 * - Churn analysis
 * - Revenue breakdown by country, industry, company size
 * - Popular plans and add-ons
 * - Revenue growth trends
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreBar, ScoreLabel } from '@/components/shared/ScoreVisualizationEngine';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Crown, BarChart3,
  PieChart, Globe, Building, Activity, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, Target, Zap, Package, AlertTriangle,
  CheckCircle, XCircle, Clock, Sparkles, Download
} from 'lucide-react';
import { generateMockAnalytics, type BillingAnalytics as BillingAnalyticsType } from '@/services/billing-engine';

// ============================================================
// Stat Card
// ============================================================

function MetricCard({ title, value, change, changeLabel, icon, color, prefix = '', suffix = '' }: {
  title: string; value: string | number; change?: number; changeLabel?: string;
  icon: React.ReactNode; color: string; prefix?: string; suffix?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold font-[Poppins]">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{isPositive ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Revenue Chart (Simple Bar)
// ============================================================

function RevenueChart({ data }: { data: { month: string; revenue: number; subscribers: number }[] }) {
  const { t } = useTranslation();
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />{t('revenue_trend')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40">
          {data.map((item, i) => {
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">${(item.revenue / 1000).toFixed(0)}k</span>
                <div className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-all cursor-pointer relative group" style={{ height: `${height}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.subscribers} {t('subscribers')}
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground">{item.month}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Popular Plans Table
// ============================================================

function PopularPlans({ plans }: { plans: { planId: string; planName: string; count: number; revenue: number }[] }) {
  const { t } = useTranslation();
  const totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />{t('popular_plans')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map((plan, i) => {
          const percentage = (plan.revenue / totalRevenue) * 100;
          const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];
          return (
            <div key={plan.planId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="text-xs font-medium">{plan.planName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">{plan.count} {t('subscribers')}</Badge>
                  <span className="text-xs font-semibold">${plan.revenue.toLocaleString()}</span>
                </div>
              </div>
              <Progress value={percentage} className="h-1.5" style={{ ['--progress-color' as string]: colors[i % colors.length] }} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Revenue by Region
// ============================================================

function RevenueByRegion({ data }: { data: { country: string; revenue: number; subscribers: number }[] }) {
  const { t } = useTranslation();
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />{t('revenue_by_country')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map(item => {
          const percentage = (item.revenue / totalRevenue) * 100;
          return (
            <div key={item.country} className="flex items-center gap-3">
              <span className="text-xs w-24 truncate">{item.country}</span>
              <div className="flex-1">
                <Progress value={percentage} className="h-2" />
              </div>
              <div className="text-end min-w-[80px]">
                <span className="text-xs font-semibold">${(item.revenue / 1000).toFixed(1)}k</span>
                <span className="text-[10px] text-muted-foreground ms-1">({percentage.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Conversion Funnel
// ============================================================

function ConversionFunnel({ analytics }: { analytics: BillingAnalyticsType }) {
  const { t } = useTranslation();

  const funnelSteps = [
    { label: t('total_signups'), value: analytics.activeSubscribers + analytics.trialUsers + 2340, color: '#3B82F6' },
    { label: t('trial_started'), value: analytics.trialUsers + 456, color: '#8B5CF6' },
    { label: t('trial_converted'), value: Math.round((analytics.trialUsers + 456) * (analytics.trialConversionRate / 100)), color: '#F59E0B' },
    { label: t('active_paid'), value: analytics.activeSubscribers, color: '#10B981' },
  ];

  const maxValue = funnelSteps[0].value;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />{t('conversion_funnel')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {funnelSteps.map((step, i) => {
          const width = (step.value / maxValue) * 100;
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{step.label}</span>
                <span className="font-medium">{step.value.toLocaleString()}</span>
              </div>
              <ScoreBar
                value={width / 100}
                size="md"
                color={step.color}
                animated
                aria-label={`${step.label}: ${width.toFixed(0)}%`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Churn & Health Metrics
// ============================================================

function HealthMetrics({ analytics }: { analytics: BillingAnalyticsType }) {
  const { t } = useTranslation();

  const metrics = [
    { label: t('trial_conversion'), value: analytics.trialConversionRate, target: 40, icon: <CheckCircle className="w-4 h-4" />, color: analytics.trialConversionRate >= 30 ? '#10B981' : '#F59E0B' },
    { label: t('upgrade_rate'), value: analytics.upgradeRate, target: 15, icon: <ArrowUpRight className="w-4 h-4" />, color: analytics.upgradeRate >= 10 ? '#10B981' : '#F59E0B' },
    { label: t('downgrade_rate'), value: analytics.downgradeRate, target: 5, icon: <ArrowDownRight className="w-4 h-4" />, color: analytics.downgradeRate <= 5 ? '#10B981' : '#EF4444' },
    { label: t('churn_rate'), value: analytics.churnRate, target: 5, icon: <XCircle className="w-4 h-4" />, color: analytics.churnRate <= 5 ? '#10B981' : '#EF4444' },
    { label: t('cancellation_rate'), value: analytics.cancellationRate, target: 5, icon: <AlertTriangle className="w-4 h-4" />, color: analytics.cancellationRate <= 5 ? '#10B981' : '#EF4444' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />{t('health_metrics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map(metric => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: metric.color }}>{metric.icon}</span>
                <span className="text-xs font-medium">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: metric.color }}>{metric.value}%</span>
                <span className="text-[10px] text-muted-foreground">/ {metric.target}% {t('target')}</span>
              </div>
            </div>
            <Progress value={(metric.value / metric.target) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Add-ons Revenue
// ============================================================

function AddonsRevenue({ addons }: { addons: { addonId: string; addonName: string; count: number; revenue: number }[] }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />{t('addon_revenue')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {addons.map(addon => (
            <div key={addon.addonId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <div>
                  <p className="text-xs font-medium">{addon.addonName}</p>
                  <p className="text-[10px] text-muted-foreground">{addon.count} {t('active')}</p>
                </div>
              </div>
              <span className="text-xs font-semibold">${addon.revenue.toLocaleString()}/mo</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Revenue by Industry
// ============================================================

function RevenueByIndustry({ data }: { data: { industry: string; revenue: number }[] }) {
  const { t } = useTranslation();
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" />{t('revenue_by_industry')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map(item => (
          <div key={item.industry} className="flex items-center gap-3">
            <ScoreLabel label={item.industry} size="sm" className="w-20 shrink-0" />
            <div className="flex-1">
              <ScoreBar value={item.revenue / maxRevenue} size="sm" animated />
            </div>
            <span className="text-xs font-medium min-w-[50px] text-end">${(item.revenue / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main BillingAnalytics Component
// ============================================================

export default function BillingAnalyticsDashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30d');
  const analytics = generateMockAnalytics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-[Poppins] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />{t('billing_analytics')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('billing_analytics_desc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('last_7_days')}</SelectItem>
              <SelectItem value="30d">{t('last_30_days')}</SelectItem>
              <SelectItem value="90d">{t('last_90_days')}</SelectItem>
              <SelectItem value="1y">{t('last_year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer">
            <Download className="w-3 h-3 me-1" />{t('export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title={t('mrr')} value={analytics.mrr} prefix="$" change={analytics.revenueGrowth} icon={<DollarSign className="w-5 h-5" />} color="#10B981" />
        <MetricCard title={t('arr')} value={analytics.arr} prefix="$" change={analytics.revenueGrowth} icon={<TrendingUp className="w-5 h-5" />} color="#3B82F6" />
        <MetricCard title={t('active_subscribers')} value={analytics.activeSubscribers} change={8.2} icon={<Users className="w-5 h-5" />} color="#8B5CF6" />
        <MetricCard title={t('arpu')} value={analytics.arpu} prefix="$" change={3.1} icon={<Target className="w-5 h-5" />} color="#F59E0B" />
        <MetricCard title={t('ltv')} value={analytics.ltv} prefix="$" change={5.4} icon={<Crown className="w-5 h-5" />} color="#EC4899" />
        <MetricCard title={t('churn_rate')} value={analytics.churnRate} suffix="%" change={-0.3} icon={<Activity className="w-5 h-5" />} color="#EF4444" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={analytics.monthlyRevenue} />
        <ConversionFunnel analytics={analytics} />
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PopularPlans plans={analytics.popularPlans} />
        <RevenueByRegion data={analytics.revenueByCountry} />
        <HealthMetrics analytics={analytics} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddonsRevenue addons={analytics.popularAddons} />
        <RevenueByIndustry data={analytics.revenueByIndustry} />
      </div>
    </div>
  );
}