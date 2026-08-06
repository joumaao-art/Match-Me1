/**
 * Analytics Dashboard - Comprehensive KPI tracking.
 * Displays: DAU, MAU, Matches, Applications, Conversion Rate,
 * Hiring Success, Time to Hire, Revenue, Retention, Churn,
 * Top Industries, Top Skills, Top Companies, Top Job Seekers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/shared';
import { ScoreBreakdown, ScoreBar, ScoreLabel } from '@/components/shared/ScoreVisualizationEngine';
import {
  Users, Activity, Heart, FileText, TrendingUp, TrendingDown,
  Target, Clock, DollarSign, UserCheck, UserMinus, Building2, Briefcase,
  Star, Award, Zap, BarChart3, PieChart, LineChart, Download, RefreshCw,
  Calendar, Globe, Crown, Medal, Trophy
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface KPICard {
  label: string;
  value: string | number;
  change?: string;
  changeUp?: boolean;
  icon: React.ReactNode;
  description?: string;
}

interface RankedItem {
  rank: number;
  name: string;
  value: string | number;
  metric: string;
  change?: string;
  changeUp?: boolean;
  avatar?: string;
}

// ============================================================
// Mock Data - Realistic analytics data
// ============================================================

const timeRanges = ['7d', '30d', '90d', '12m', 'all'] as const;

const kpiData = {
  dau: { value: 2847, change: '+12.3%', changeUp: true, prev: 2534 },
  mau: { value: 18432, change: '+8.7%', changeUp: true, prev: 16952 },
  matches: { value: 4521, change: '+23.1%', changeUp: true, prev: 3672 },
  applications: { value: 18234, change: '+15.4%', changeUp: true, prev: 15801 },
  conversionRate: { value: 34.2, change: '+5.2%', changeUp: true, prev: 29.0 },
  hiringSuccess: { value: 67.8, change: '+3.1%', changeUp: true, prev: 64.7 },
  timeToHire: { value: 18, change: '-2.3 days', changeUp: true, prev: 20.3 },
  revenue: { value: 284500, change: '+15.7%', changeUp: true, prev: 245900 },
  retention: { value: 72.4, change: '+4.2%', changeUp: true, prev: 68.2 },
  churn: { value: 3.2, change: '-0.8%', changeUp: true, prev: 4.0 },
};

const dailyActiveData = [
  { day: 'Mon', value: 2654 }, { day: 'Tue', value: 2891 }, { day: 'Wed', value: 3102 },
  { day: 'Thu', value: 2987 }, { day: 'Fri', value: 2756 }, { day: 'Sat', value: 1834 },
  { day: 'Sun', value: 1623 },
];

const monthlyTrend = [
  { month: 'Jan', users: 12400, matches: 2100, revenue: 180000 },
  { month: 'Feb', users: 13200, matches: 2450, revenue: 195000 },
  { month: 'Mar', users: 14100, matches: 2800, revenue: 210000 },
  { month: 'Apr', users: 15300, matches: 3200, revenue: 228000 },
  { month: 'May', users: 16500, matches: 3650, revenue: 248000 },
  { month: 'Jun', users: 17800, matches: 4100, revenue: 267000 },
  { month: 'Jul', users: 18432, matches: 4521, revenue: 284500 },
];

const topIndustries: RankedItem[] = [
  { rank: 1, name: 'Information Technology', value: '4,231', metric: 'active jobs', change: '+18%', changeUp: true },
  { rank: 2, name: 'Healthcare & Medical', value: '2,847', metric: 'active jobs', change: '+12%', changeUp: true },
  { rank: 3, name: 'Finance & Banking', value: '2,156', metric: 'active jobs', change: '+9%', changeUp: true },
  { rank: 4, name: 'Engineering', value: '1,893', metric: 'active jobs', change: '+15%', changeUp: true },
  { rank: 5, name: 'Education', value: '1,567', metric: 'active jobs', change: '+7%', changeUp: true },
  { rank: 6, name: 'Marketing & Advertising', value: '1,342', metric: 'active jobs', change: '+22%', changeUp: true },
  { rank: 7, name: 'Oil & Gas', value: '1,128', metric: 'active jobs', change: '-3%', changeUp: false },
  { rank: 8, name: 'Construction', value: '987', metric: 'active jobs', change: '+5%', changeUp: true },
  { rank: 9, name: 'Retail & E-commerce', value: '876', metric: 'active jobs', change: '+31%', changeUp: true },
  { rank: 10, name: 'Hospitality & Tourism', value: '743', metric: 'active jobs', change: '+11%', changeUp: true },
];

const topSkills: RankedItem[] = [
  { rank: 1, name: 'React / React Native', value: '8,432', metric: 'demand score', change: '+24%', changeUp: true },
  { rank: 2, name: 'Python', value: '7,891', metric: 'demand score', change: '+19%', changeUp: true },
  { rank: 3, name: 'Data Analysis', value: '6,543', metric: 'demand score', change: '+28%', changeUp: true },
  { rank: 4, name: 'Project Management', value: '5,987', metric: 'demand score', change: '+8%', changeUp: true },
  { rank: 5, name: 'Cloud Computing (AWS/Azure)', value: '5,432', metric: 'demand score', change: '+32%', changeUp: true },
  { rank: 6, name: 'Machine Learning / AI', value: '4,876', metric: 'demand score', change: '+45%', changeUp: true },
  { rank: 7, name: 'UI/UX Design', value: '4,321', metric: 'demand score', change: '+16%', changeUp: true },
  { rank: 8, name: 'DevOps / CI/CD', value: '3,987', metric: 'demand score', change: '+21%', changeUp: true },
  { rank: 9, name: 'SQL / Database Management', value: '3,654', metric: 'demand score', change: '+6%', changeUp: true },
  { rank: 10, name: 'Cybersecurity', value: '3,210', metric: 'demand score', change: '+38%', changeUp: true },
];

const topCompanies: RankedItem[] = [
  { rank: 1, name: 'TechCorp International', value: 156, metric: 'hires this quarter', change: '+34%', changeUp: true },
  { rank: 2, name: 'Saudi Aramco Digital', value: 134, metric: 'hires this quarter', change: '+12%', changeUp: true },
  { rank: 3, name: 'NEOM Technologies', value: 121, metric: 'hires this quarter', change: '+67%', changeUp: true },
  { rank: 4, name: 'Careem (Uber)', value: 98, metric: 'hires this quarter', change: '+8%', changeUp: true },
  { rank: 5, name: 'STC Solutions', value: 87, metric: 'hires this quarter', change: '+15%', changeUp: true },
  { rank: 6, name: 'Noon Academy', value: 76, metric: 'hires this quarter', change: '+22%', changeUp: true },
  { rank: 7, name: 'Jarir Marketing', value: 65, metric: 'hires this quarter', change: '-5%', changeUp: false },
  { rank: 8, name: 'Al Rajhi Bank', value: 58, metric: 'hires this quarter', change: '+18%', changeUp: true },
  { rank: 9, name: 'Mobily', value: 52, metric: 'hires this quarter', change: '+9%', changeUp: true },
  { rank: 10, name: 'Foodics', value: 47, metric: 'hires this quarter', change: '+41%', changeUp: true },
];

const topJobSeekers: RankedItem[] = [
  { rank: 1, name: 'Ahmed Al-Rashid', value: 94, metric: 'match score avg', change: '12 offers', changeUp: true },
  { rank: 2, name: 'Fatima Al-Zahrani', value: 92, metric: 'match score avg', change: '10 offers', changeUp: true },
  { rank: 3, name: 'Mohammed Khalid', value: 91, metric: 'match score avg', change: '9 offers', changeUp: true },
  { rank: 4, name: 'Sara Al-Otaibi', value: 89, metric: 'match score avg', change: '8 offers', changeUp: true },
  { rank: 5, name: 'Omar Hassan', value: 88, metric: 'match score avg', change: '7 offers', changeUp: true },
  { rank: 6, name: 'Noura Al-Dossari', value: 87, metric: 'match score avg', change: '7 offers', changeUp: true },
  { rank: 7, name: 'Khalid Ibrahim', value: 86, metric: 'match score avg', change: '6 offers', changeUp: true },
  { rank: 8, name: 'Lina Mahmoud', value: 85, metric: 'match score avg', change: '6 offers', changeUp: true },
  { rank: 9, name: 'Youssef Al-Harbi', value: 84, metric: 'match score avg', change: '5 offers', changeUp: true },
  { rank: 10, name: 'Reem Al-Shammari', value: 83, metric: 'match score avg', change: '5 offers', changeUp: true },
];

const conversionFunnel = [
  { stage: 'Profile Views', count: 45230, pct: 100 },
  { stage: 'Swipe Right', count: 18234, pct: 40.3 },
  { stage: 'Mutual Match', count: 4521, pct: 24.8 },
  { stage: 'Message Sent', count: 3156, pct: 69.8 },
  { stage: 'Interview Scheduled', count: 1893, pct: 60.0 },
  { stage: 'Offer Made', count: 987, pct: 52.1 },
  { stage: 'Hired', count: 672, pct: 68.1 },
];

const retentionCohorts = [
  { cohort: 'Jan 2026', week1: 100, week2: 78, week4: 65, week8: 54, week12: 48 },
  { cohort: 'Feb 2026', week1: 100, week2: 80, week4: 68, week8: 57, week12: 51 },
  { cohort: 'Mar 2026', week1: 100, week2: 82, week4: 71, week8: 61, week12: 55 },
  { cohort: 'Apr 2026', week1: 100, week2: 84, week4: 73, week8: 64, week12: '-' },
  { cohort: 'May 2026', week1: 100, week2: 85, week4: 75, week8: '-', week12: '-' },
  { cohort: 'Jun 2026', week1: 100, week2: 86, week4: '-', week8: '-', week12: '-' },
];

// ============================================================
// Sub-components
// ============================================================

function KPIStatCard({ label, value, change, changeUp, icon, description }: KPICard) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1.5 font-[Poppins] truncate">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-1.5 ${changeUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {changeUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium">{change}</span>
              </div>
            )}
            {description && <p className="text-[11px] text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ms-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartVisual({ data, valueKey, labelKey, maxValue, color = 'bg-primary' }: { data: any[]; valueKey: string; labelKey: string; maxValue: number; color?: string }) {
  return (
    <div className="flex items-end gap-2 h-44">
      {data.map((item, i) => {
        const pct = (item[valueKey] / maxValue) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">{item[valueKey].toLocaleString()}</span>
            <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer" style={{ height: `${pct}%`, minHeight: '4px' }}>
              <div className={`w-full h-full rounded-t-md ${color}`} />
            </div>
            <span className="text-[10px] text-muted-foreground">{item[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniLineChart({ data, color = 'text-primary' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-12 ${color}`} preserveAspectRatio="none">
      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function RankingList({ items, icon }: { items: RankedItem[]; icon: React.ReactNode }) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-700" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.rank} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            {getRankIcon(item.rank)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.value} {item.metric}</p>
          </div>
          {item.change && (
            <Badge variant={item.changeUp ? 'default' : 'destructive'} className="text-[10px] shrink-0">
              {item.change}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

function FunnelChart({ data }: { data: typeof conversionFunnel }) {
  return (
    <div className="space-y-2">
      {data.map((stage, i) => {
        const width = Math.max(20, (stage.count / data[0].count) * 100);
        return (
          <div key={i} className="flex items-center gap-3">
            <ScoreLabel label={stage.stage} size="sm" className="w-36 shrink-0 text-end" />
            <div className="flex-1 relative">
              <ScoreBar value={width / 100} size="md" animated />
            </div>
            <div className="w-12 text-xs font-medium text-end shrink-0">
              {i === 0 ? '—' : `${stage.pct}%`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RetentionHeatmap({ data }: { data: typeof retentionCohorts }) {
  const getColor = (val: number | string) => {
    if (val === '-') return 'bg-muted text-muted-foreground';
    const n = Number(val);
    if (n >= 80) return 'bg-emerald-500/80 text-white';
    if (n >= 60) return 'bg-emerald-400/60 text-emerald-900';
    if (n >= 40) return 'bg-amber-400/50 text-amber-900';
    return 'bg-red-400/40 text-red-900';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-start p-2 font-medium text-muted-foreground">Cohort</th>
            <th className="p-2 font-medium text-muted-foreground">Week 1</th>
            <th className="p-2 font-medium text-muted-foreground">Week 2</th>
            <th className="p-2 font-medium text-muted-foreground">Week 4</th>
            <th className="p-2 font-medium text-muted-foreground">Week 8</th>
            <th className="p-2 font-medium text-muted-foreground">Week 12</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="p-2 font-medium">{row.cohort}</td>
              {[row.week1, row.week2, row.week4, row.week8, row.week12].map((val, j) => (
                <td key={j} className="p-1">
                  <div className={`rounded px-2 py-1.5 text-center font-medium ${getColor(val)}`}>
                    {val === '-' ? '—' : `${val}%`}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Analytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton fallbackRoute="/admin" />
              <div>
                <h1 className="text-lg font-bold font-[Poppins]">Analytics Dashboard</h1>
                <p className="text-xs text-muted-foreground">Platform performance & KPIs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <Calendar className="w-3 h-3 me-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer h-8 text-xs">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="cursor-pointer gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="engagement" className="cursor-pointer gap-1.5"><Activity className="w-3.5 h-3.5" /> Engagement</TabsTrigger>
            <TabsTrigger value="revenue" className="cursor-pointer gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Revenue</TabsTrigger>
            <TabsTrigger value="rankings" className="cursor-pointer gap-1.5"><Trophy className="w-3.5 h-3.5" /> Rankings</TabsTrigger>
          </TabsList>

          {/* ============ OVERVIEW TAB ============ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Primary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPIStatCard label="Daily Active Users" value={kpiData.dau.value.toLocaleString()} change={kpiData.dau.change} changeUp={kpiData.dau.changeUp} icon={<Users className="w-5 h-5" />} description="vs last period" />
              <KPIStatCard label="Monthly Active Users" value={kpiData.mau.value.toLocaleString()} change={kpiData.mau.change} changeUp={kpiData.mau.changeUp} icon={<Activity className="w-5 h-5" />} description="vs last period" />
              <KPIStatCard label="Total Matches" value={kpiData.matches.value.toLocaleString()} change={kpiData.matches.change} changeUp={kpiData.matches.changeUp} icon={<Heart className="w-5 h-5" />} description="mutual matches" />
              <KPIStatCard label="Applications" value={kpiData.applications.value.toLocaleString()} change={kpiData.applications.change} changeUp={kpiData.applications.changeUp} icon={<FileText className="w-5 h-5" />} description="total submitted" />
              <KPIStatCard label="Conversion Rate" value={`${kpiData.conversionRate.value}%`} change={kpiData.conversionRate.change} changeUp={kpiData.conversionRate.changeUp} icon={<Target className="w-5 h-5" />} description="match → hire" />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPIStatCard label="Hiring Success" value={`${kpiData.hiringSuccess.value}%`} change={kpiData.hiringSuccess.change} changeUp={kpiData.hiringSuccess.changeUp} icon={<UserCheck className="w-5 h-5" />} description="offers accepted" />
              <KPIStatCard label="Time to Hire" value={`${kpiData.timeToHire.value} days`} change={kpiData.timeToHire.change} changeUp={kpiData.timeToHire.changeUp} icon={<Clock className="w-5 h-5" />} description="avg from match" />
              <KPIStatCard label="Revenue" value={`$${(kpiData.revenue.value / 1000).toFixed(1)}K`} change={kpiData.revenue.change} changeUp={kpiData.revenue.changeUp} icon={<DollarSign className="w-5 h-5" />} description="this period" />
              <KPIStatCard label="Retention (30d)" value={`${kpiData.retention.value}%`} change={kpiData.retention.change} changeUp={kpiData.retention.changeUp} icon={<UserCheck className="w-5 h-5" />} description="users returning" />
              <KPIStatCard label="Churn Rate" value={`${kpiData.churn.value}%`} change={kpiData.churn.change} changeUp={kpiData.churn.changeUp} icon={<UserMinus className="w-5 h-5" />} description="monthly churn" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DAU Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Daily Active Users
                  </CardTitle>
                  <CardDescription className="text-xs">This week's activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChartVisual data={dailyActiveData} valueKey="value" labelKey="day" maxValue={3500} />
                </CardContent>
              </Card>

              {/* Monthly Growth */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Monthly Growth Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Users, Matches & Revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Users</span>
                        <span className="text-xs font-medium">18,432</span>
                      </div>
                      <MiniLineChart data={monthlyTrend.map(m => m.users)} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Matches</span>
                        <span className="text-xs font-medium">4,521</span>
                      </div>
                      <MiniLineChart data={monthlyTrend.map(m => m.matches)} color="text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Revenue ($K)</span>
                        <span className="text-xs font-medium">$284.5K</span>
                      </div>
                      <MiniLineChart data={monthlyTrend.map(m => m.revenue / 1000)} color="text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Conversion Funnel
                </CardTitle>
                <CardDescription className="text-xs">From profile view to successful hire</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart data={conversionFunnel} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ ENGAGEMENT TAB ============ */}
          <TabsContent value="engagement" className="space-y-6">
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPIStatCard label="Swipes / Day" value="34,521" change="+18%" changeUp icon={<Heart className="w-5 h-5" />} />
              <KPIStatCard label="Messages / Day" value="8,234" change="+12%" changeUp icon={<Zap className="w-5 h-5" />} />
              <KPIStatCard label="Avg Session Duration" value="8.5 min" change="+1.2 min" changeUp icon={<Clock className="w-5 h-5" />} />
              <KPIStatCard label="Profile Completeness" value="78%" change="+5%" changeUp icon={<UserCheck className="w-5 h-5" />} />
            </div>

            {/* Retention Heatmap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Retention Cohort Analysis
                </CardTitle>
                <CardDescription className="text-xs">User retention by signup cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionHeatmap data={retentionCohorts} />
              </CardContent>
            </Card>

            {/* Engagement Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins]">User Activity Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScoreBreakdown
                    items={[
                      { label: 'Profile browsing', value: 0.35, colorClass: 'bg-blue-500' },
                      { label: 'Swiping / Matching', value: 0.28, colorClass: 'bg-emerald-500' },
                      { label: 'Messaging', value: 0.20, colorClass: 'bg-purple-500' },
                      { label: 'Job applications', value: 0.12, colorClass: 'bg-amber-500' },
                      { label: 'Settings / Profile editing', value: 0.05, colorClass: 'bg-slate-400' },
                    ]}
                    layout="stacked"
                    barSize="md"
                    labelSize="sm"
                    animated
                    showPercentage
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins]">Peak Usage Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 24 }, (_, h) => {
                      const intensity = h >= 8 && h <= 22
                        ? (h >= 10 && h <= 14 ? 90 : h >= 18 && h <= 21 ? 85 : 40 + Math.random() * 30)
                        : 10 + Math.random() * 15;
                      return (
                        <div key={h} className="flex flex-col items-center gap-0.5">
                          <div
                            className="w-full aspect-square rounded-sm transition-colors cursor-pointer"
                            style={{ backgroundColor: `hsl(221, 83%, ${100 - intensity * 0.6}%)`, opacity: 0.3 + intensity / 100 * 0.7 }}
                            title={`${h}:00 - ${intensity.toFixed(0)}% activity`}
                          />
                          {h % 4 === 0 && <span className="text-[9px] text-muted-foreground">{h}h</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                    <span>Low activity</span>
                    <div className="flex gap-0.5">
                      {[20, 40, 60, 80, 100].map(v => (
                        <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(221, 83%, ${100 - v * 0.6}%)`, opacity: 0.3 + v / 100 * 0.7 }} />
                      ))}
                    </div>
                    <span>High activity</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ REVENUE TAB ============ */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPIStatCard label="MRR" value="$47,200" change="+15.7%" changeUp icon={<DollarSign className="w-5 h-5" />} description="Monthly recurring" />
              <KPIStatCard label="ARR" value="$566,400" change="+22%" changeUp icon={<TrendingUp className="w-5 h-5" />} description="Annual recurring" />
              <KPIStatCard label="ARPU" value="$24.90" change="+8.3%" changeUp icon={<Users className="w-5 h-5" />} description="Avg revenue/user" />
              <KPIStatCard label="LTV" value="$342" change="+12%" changeUp icon={<Star className="w-5 h-5" />} description="Lifetime value" />
            </div>

            {/* Revenue Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs">Monthly revenue growth (in thousands)</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartVisual data={monthlyTrend.map(m => ({ ...m, rev: m.revenue / 1000 }))} valueKey="rev" labelKey="month" maxValue={300} color="bg-emerald-500" />
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins]">Revenue by Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { plan: 'Enterprise', revenue: '$18,900', pct: 40, color: 'bg-primary' },
                    { plan: 'Business', revenue: '$14,160', pct: 30, color: 'bg-blue-400' },
                    { plan: 'Premium', revenue: '$9,440', pct: 20, color: 'bg-emerald-500' },
                    { plan: 'Starter', revenue: '$4,700', pct: 10, color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.plan}</span>
                          <span className="text-sm font-bold">{item.revenue}</span>
                        </div>
                        <Progress value={item.pct} className="h-1.5 mt-1" />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-end">{item.pct}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-[Poppins]">Revenue Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Net Revenue Retention', value: '112%', desc: 'Expansion > Churn' },
                    { label: 'Gross Margin', value: '89%', desc: 'After infrastructure costs' },
                    { label: 'CAC Payback', value: '3.2 months', desc: 'Cost to acquire customer' },
                    { label: 'LTV:CAC Ratio', value: '4.8x', desc: 'Healthy > 3x' },
                    { label: 'Expansion Revenue', value: '+$8,400/mo', desc: 'Upgrades & add-ons' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============ RANKINGS TAB ============ */}
          <TabsContent value="rankings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Industries */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> Top Industries
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">By active jobs</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <RankingList items={topIndustries} icon={<Building2 className="w-4 h-4" />} />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Top Skills in Demand
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">By demand score</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <RankingList items={topSkills} icon={<Star className="w-4 h-4" />} />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Companies */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" /> Top Companies
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">By hires this quarter</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <RankingList items={topCompanies} icon={<Crown className="w-4 h-4" />} />
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Job Seekers */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Top Job Seekers
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">By match score</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[420px]">
                    <RankingList items={topJobSeekers} icon={<Award className="w-4 h-4" />} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}