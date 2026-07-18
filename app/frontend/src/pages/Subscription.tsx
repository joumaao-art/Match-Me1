import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BackButton } from '@/components/shared';
import { useAuthStore } from '@/stores';
import {
  Crown, Check, X, Zap, Building, Rocket, Star, CreditCard, Receipt,
  Tag, Clock, BarChart3, Shield, Users, Briefcase, Eye, MessageSquare,
  Download, Sparkles, Gift, Percent, Search, Heart, FileText, Globe,
  Bookmark, Video, Award, Target, TrendingUp
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  features: string[];
  limits: Record<string, number>;
  trialDays: number;
  targetRole: 'job_seeker' | 'company';
}

interface PlanFeature {
  name: string;
  values: (string | boolean)[];
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
}

interface Coupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  validUntil: string;
  applicablePlans: string[];
}

// ============================================================
// Job Seeker Plans
// ============================================================

const SEEKER_PLANS: SubscriptionPlan[] = [
  {
    id: 'seeker_free',
    name: 'Free',
    description: 'seeker_plan_free_desc',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    icon: <Zap className="w-5 h-5" />,
    color: '#64748B',
    features: ['seeker_feat_create_profile', 'seeker_feat_upload_cv', 'seeker_feat_search_jobs', 'seeker_feat_save_jobs', 'seeker_feat_apply_jobs', 'seeker_feat_ai_matches', 'seeker_feat_messaging', 'seeker_feat_interviews'],
    limits: { swipesPerDay: 10, messagesPerDay: 10, profileViews: 10, savedJobs: 20, aiMatchesPerDay: 5 },
    trialDays: 0,
    targetRole: 'job_seeker',
  },
  {
    id: 'seeker_premium',
    name: 'Premium',
    description: 'seeker_plan_premium_new_desc',
    monthlyPrice: 19.99,
    yearlyPrice: 14.99,
    currency: 'USD',
    icon: <Star className="w-5 h-5" />,
    color: '#3B82F6',
    popular: true,
    features: ['seeker_feat_all_free', 'seeker_feat_directory_visibility', 'seeker_feat_discoverability', 'seeker_feat_visibility_settings', 'seeker_feat_contact_requests', 'seeker_feat_ai_recommendations', 'seeker_feat_profile_views', 'seeker_feat_exposure_analytics', 'seeker_feat_unlimited_swipes', 'seeker_feat_unlimited_messages'],
    limits: { swipesPerDay: -1, messagesPerDay: -1, profileViews: -1, savedJobs: -1, aiMatchesPerDay: 50 },
    trialDays: 7,
    targetRole: 'job_seeker',
  },
  {
    id: 'seeker_premium_plus',
    name: 'Premium+',
    description: 'seeker_plan_premium_plus_desc',
    monthlyPrice: 39.99,
    yearlyPrice: 29.99,
    currency: 'USD',
    icon: <Crown className="w-5 h-5" />,
    color: '#8B5CF6',
    features: ['seeker_feat_all_premium', 'seeker_feat_featured_candidate', 'seeker_feat_featured_badge', 'seeker_feat_priority_visibility', 'seeker_feat_higher_ai_visibility', 'seeker_feat_featured_placement', 'seeker_feat_recruiter_engagement', 'seeker_feat_advanced_analytics', 'seeker_feat_unlimited_everything'],
    limits: { swipesPerDay: -1, messagesPerDay: -1, profileViews: -1, savedJobs: -1, aiMatchesPerDay: -1 },
    trialDays: 7,
    targetRole: 'job_seeker',
  },
];

// ============================================================
// Company Plans
// ============================================================

const COMPANY_PLANS: SubscriptionPlan[] = [
  {
    id: 'company_starter',
    name: 'Starter',
    description: 'company_plan_starter_desc',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD',
    icon: <Zap className="w-5 h-5" />,
    color: '#64748B',
    features: ['company_feat_3_jobs', 'company_feat_50_views', 'company_feat_10_messages', 'company_feat_basic_matching', 'company_feat_email_support'],
    limits: { jobPostings: 3, candidateViews: 50, messagesPerDay: 10, teamMembers: 1, aiMatchesPerDay: 5, cvDownloads: 5, analyticsRetentionDays: 7 },
    trialDays: 0,
    targetRole: 'company',
  },
  {
    id: 'company_professional',
    name: 'Professional',
    description: 'company_plan_professional_desc',
    monthlyPrice: 49,
    yearlyPrice: 39,
    currency: 'USD',
    icon: <Star className="w-5 h-5" />,
    color: '#3B82F6',
    popular: true,
    features: ['company_feat_15_jobs', 'company_feat_500_views', 'company_feat_unlimited_messages', 'company_feat_ai_matching', 'company_feat_priority_support', 'company_feat_analytics', 'company_feat_3_team'],
    limits: { jobPostings: 15, candidateViews: 500, messagesPerDay: -1, teamMembers: 3, aiMatchesPerDay: 50, cvDownloads: 50, analyticsRetentionDays: 30 },
    trialDays: 14,
    targetRole: 'company',
  },
  {
    id: 'company_business',
    name: 'Business',
    description: 'company_plan_business_desc',
    monthlyPrice: 149,
    yearlyPrice: 119,
    currency: 'USD',
    icon: <Building className="w-5 h-5" />,
    color: '#8B5CF6',
    features: ['company_feat_50_jobs', 'company_feat_unlimited_views', 'company_feat_unlimited_messages', 'company_feat_advanced_ai', 'company_feat_dedicated_support', 'company_feat_full_analytics', 'company_feat_10_team', 'company_feat_api_access', 'company_feat_custom_branding'],
    limits: { jobPostings: 50, candidateViews: -1, messagesPerDay: -1, teamMembers: 10, aiMatchesPerDay: -1, cvDownloads: -1, analyticsRetentionDays: 90 },
    trialDays: 14,
    targetRole: 'company',
  },
  {
    id: 'company_enterprise',
    name: 'Enterprise',
    description: 'company_plan_enterprise_desc',
    monthlyPrice: -1,
    yearlyPrice: -1,
    currency: 'USD',
    icon: <Rocket className="w-5 h-5" />,
    color: '#F59E0B',
    features: ['company_feat_unlimited_jobs', 'company_feat_unlimited_views', 'company_feat_unlimited_messages', 'company_feat_custom_ai', 'company_feat_sla_support', 'company_feat_full_analytics', 'company_feat_unlimited_team', 'company_feat_full_api', 'company_feat_white_label', 'company_feat_onboarding', 'company_feat_custom_integrations'],
    limits: { jobPostings: -1, candidateViews: -1, messagesPerDay: -1, teamMembers: -1, aiMatchesPerDay: -1, cvDownloads: -1, analyticsRetentionDays: 365 },
    trialDays: 30,
    targetRole: 'company',
  },
];

// ============================================================
// Feature Comparison Tables
// ============================================================

const SEEKER_FEATURE_COMPARISON: PlanFeature[] = [
  { name: 'seeker_feat_daily_swipes', values: ['5', 'Unlimited', 'Unlimited'] },
  { name: 'seeker_feat_daily_messages_row', values: ['5', 'Unlimited', 'Unlimited'] },
  { name: 'seeker_feat_profile_views_row', values: ['10/mo', 'Unlimited', 'Unlimited'] },
  { name: 'seeker_feat_saved_jobs_row', values: ['10', '100', 'Unlimited'] },
  { name: 'seeker_feat_ai_matches_row', values: ['3/day', '25/day', 'Unlimited'] },
  { name: 'seeker_feat_who_viewed_row', values: [false, true, true] },
  { name: 'seeker_feat_read_receipts_row', values: [false, true, true] },
  { name: 'seeker_feat_priority_visibility_row', values: [false, true, true] },
  { name: 'seeker_feat_video_intro_row', values: [false, false, true] },
  { name: 'seeker_feat_salary_insights_row', values: [false, false, true] },
  { name: 'seeker_feat_interview_prep_row', values: [false, false, true] },
];

const COMPANY_FEATURE_COMPARISON: PlanFeature[] = [
  { name: 'company_feat_job_postings_row', values: ['3', '15', '50', 'Unlimited'] },
  { name: 'company_feat_candidate_views_row', values: ['50/mo', '500/mo', 'Unlimited', 'Unlimited'] },
  { name: 'company_feat_daily_messages_row', values: ['10', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { name: 'company_feat_ai_matches_row', values: ['5/day', '50/day', 'Unlimited', 'Custom'] },
  { name: 'company_feat_team_members_row', values: ['1', '3', '10', 'Unlimited'] },
  { name: 'company_feat_cv_downloads_row', values: ['5/mo', '50/mo', 'Unlimited', 'Unlimited'] },
  { name: 'company_feat_analytics_row', values: [false, true, true, true] },
  { name: 'company_feat_api_access_row', values: [false, false, true, true] },
  { name: 'company_feat_custom_branding_row', values: [false, false, true, true] },
  { name: 'company_feat_white_label_row', values: [false, false, false, true] },
  { name: 'company_feat_dedicated_manager_row', values: [false, false, false, true] },
  { name: 'company_feat_sla_row', values: [false, false, false, true] },
];

// ============================================================
// Mock Data
// ============================================================

const SEEKER_INVOICES: Invoice[] = [
  { id: 'inv-s001', date: '2026-07-01', amount: 14.99, currency: 'USD', status: 'paid', planName: 'Plus' },
  { id: 'inv-s002', date: '2026-06-01', amount: 14.99, currency: 'USD', status: 'paid', planName: 'Plus' },
  { id: 'inv-s003', date: '2026-05-01', amount: 14.99, currency: 'USD', status: 'paid', planName: 'Plus' },
];

const COMPANY_INVOICES: Invoice[] = [
  { id: 'inv-c001', date: '2026-07-01', amount: 49, currency: 'USD', status: 'paid', planName: 'Professional' },
  { id: 'inv-c002', date: '2026-06-01', amount: 49, currency: 'USD', status: 'paid', planName: 'Professional' },
  { id: 'inv-c003', date: '2026-05-01', amount: 49, currency: 'USD', status: 'paid', planName: 'Professional' },
  { id: 'inv-c004', date: '2026-04-01', amount: 39, currency: 'USD', status: 'paid', planName: 'Starter' },
];

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'WELCOME50', discount: 50, type: 'percentage', validUntil: '2026-08-31', applicablePlans: ['seeker_plus', 'seeker_premium', 'company_professional', 'company_business'] },
  { code: 'SAVE20', discount: 20, type: 'percentage', validUntil: '2026-12-31', applicablePlans: ['seeker_plus', 'seeker_premium', 'company_professional', 'company_business', 'company_enterprise'] },
  { code: 'FLAT10', discount: 10, type: 'fixed', validUntil: '2026-09-30', applicablePlans: ['seeker_plus', 'company_professional', 'company_business'] },
];

// ============================================================
// Payment Methods
// ============================================================

type PaymentMethod = 'stripe' | 'moyasar' | 'apple_pay' | 'google_pay';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string; available: boolean }[] = [
  { id: 'stripe', name: 'Stripe', icon: '💳', available: true },
  { id: 'moyasar', name: 'Moyasar', icon: '🏦', available: true },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎', available: true },
  { id: 'google_pay', name: 'Google Pay', icon: '🟢', available: true },
];

// ============================================================
// Components
// ============================================================

function PlanCard({
  plan, isYearly, currentPlan, onSelect, appliedDiscount
}: {
  plan: SubscriptionPlan;
  isYearly: boolean;
  currentPlan: string;
  onSelect: (planId: string) => void;
  appliedDiscount: number;
}) {
  const { t } = useTranslation();
  const isCurrent = currentPlan === plan.id;
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const discountedPrice = appliedDiscount > 0 && price > 0 ? Math.round(price * (1 - appliedDiscount / 100) * 100) / 100 : price;

  return (
    <Card className={`relative flex flex-col transition-smooth hover:shadow-lg ${plan.popular ? 'border-primary shadow-md ring-2 ring-primary/20' : ''} ${isCurrent ? 'border-green-500 bg-green-50/30' : ''}`}>
      {plan.popular && (
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
        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>
          {plan.icon}
        </div>
        <CardTitle className="text-lg font-[Poppins]">{plan.name}</CardTitle>
        <CardDescription className="text-xs">{t(plan.description)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-center mb-4">
          {price === 0 ? (
            <div className="text-3xl font-bold font-[Poppins]">{t('free')}</div>
          ) : price === -1 ? (
            <div className="text-xl font-bold font-[Poppins]">{t('custom_pricing')}</div>
          ) : (
            <div>
              {appliedDiscount > 0 && (
                <span className="text-sm text-muted-foreground line-through me-2">${price}</span>
              )}
              <span className="text-3xl font-bold font-[Poppins]">${discountedPrice}</span>
              <span className="text-sm text-muted-foreground">/{t('month')}</span>
              {isYearly && plan.monthlyPrice > 0 && (
                <p className="text-xs text-green-600 mt-1">{t('save')} {Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100)}% {t('yearly')}</p>
              )}
            </div>
          )}
        </div>
        {plan.trialDays > 0 && !isCurrent && (
          <div className="flex items-center justify-center gap-1 mb-3">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{plan.trialDays} {t('day_free_trial')}</span>
          </div>
        )}
        <ul className="space-y-2">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
              <span>{t(feat)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant="outline" className="w-full cursor-pointer" disabled>{t('current_plan')}</Button>
        ) : price === -1 ? (
          <Button variant="outline" className="w-full cursor-pointer" onClick={() => onSelect(plan.id)}>{t('contact_sales')}</Button>
        ) : (
          <Button className="w-full cursor-pointer" style={{ backgroundColor: plan.color }} onClick={() => onSelect(plan.id)}>
            {price === 0 ? t('get_started') : t('upgrade_now')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FeatureComparison({ features, planNames }: { features: PlanFeature[]; planNames: string[] }) {
  const { t } = useTranslation();

  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? <Check className="w-4 h-4 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
    }
    return <span className="text-xs font-medium">{value}</span>;
  };

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
              {planNames.map((name, i) => (
                <th key={i} className={`text-center py-2 px-2 font-medium ${i === 1 ? 'text-primary' : ''}`}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feat, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5 pe-4 text-muted-foreground">{t(feat.name)}</td>
                {feat.values.map((val, j) => (
                  <td key={j} className={`text-center py-2.5 px-2 ${j === 1 ? 'bg-primary/5' : ''}`}>{renderCell(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function UsageTracker({ role }: { role: 'job_seeker' | 'company' }) {
  const { t } = useTranslation();

  const seekerUsage = [
    { key: 'daily_swipes', icon: <Heart className="w-4 h-4" />, used: 3, limit: -1 },
    { key: 'messages_today', icon: <MessageSquare className="w-4 h-4" />, used: 12, limit: -1 },
    { key: 'profile_views', icon: <Eye className="w-4 h-4" />, used: 45, limit: -1 },
    { key: 'saved_jobs', icon: <Bookmark className="w-4 h-4" />, used: 34, limit: 100 },
    { key: 'ai_matches_today', icon: <Sparkles className="w-4 h-4" />, used: 8, limit: 25 },
  ];

  const companyUsage = [
    { key: 'job_postings', icon: <Briefcase className="w-4 h-4" />, used: 8, limit: 15 },
    { key: 'candidate_views', icon: <Eye className="w-4 h-4" />, used: 234, limit: 500 },
    { key: 'messages_today', icon: <MessageSquare className="w-4 h-4" />, used: 45, limit: -1 },
    { key: 'ai_matches_today', icon: <Sparkles className="w-4 h-4" />, used: 23, limit: 50 },
    { key: 'cv_downloads', icon: <Download className="w-4 h-4" />, used: 12, limit: 50 },
  ];

  const items = role === 'job_seeker' ? seekerUsage : companyUsage;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />{t('usage_tracking')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => {
          const percentage = item.limit === -1 ? 0 : Math.min((item.used / item.limit) * 100, 100);
          const isUnlimited = item.limit === -1;
          const isNearLimit = !isUnlimited && percentage >= 80;
          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <span className="text-xs font-medium">{t(item.key)}</span>
                </div>
                <span className={`text-xs font-medium ${isNearLimit ? 'text-amber-600' : ''}`}>
                  {item.used} / {isUnlimited ? '∞' : item.limit}
                </span>
              </div>
              {!isUnlimited && <Progress value={percentage} className={`h-1.5 ${isNearLimit ? '[&>div]:bg-amber-500' : ''}`} />}
              {isUnlimited && <p className="text-[10px] text-green-600">{t('unlimited')}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" />{t('invoices')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><Receipt className="w-4 h-4 text-primary" /></div>
                <div>
                  <p className="text-xs font-medium">{inv.planName} — {inv.date}</p>
                  <p className="text-[10px] text-muted-foreground">{inv.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                  {t(inv.status)}
                </Badge>
                <span className="text-sm font-semibold">${inv.amount}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer"><Download className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CouponInput({ onApply }: { onApply: (discount: number) => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<Coupon | null>(null);
  const [error, setError] = useState('');

  const handleApply = () => {
    setError('');
    const coupon = AVAILABLE_COUPONS.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (!coupon) {
      setError(t('invalid_coupon'));
      return;
    }
    const now = new Date();
    if (new Date(coupon.validUntil) < now) {
      setError(t('coupon_expired'));
      return;
    }
    setApplied(coupon);
    onApply(coupon.discount);
    toast.success(`${t('coupon_applied')}: ${coupon.discount}${coupon.type === 'percentage' ? '%' : '$'} ${t('off')}`);
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    onApply(0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />{t('promo_code')}</CardTitle>
      </CardHeader>
      <CardContent>
        {applied ? (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">{applied.code}</p>
                <p className="text-xs text-green-600">{applied.discount}{applied.type === 'percentage' ? '%' : '$'} {t('off')} · {t('valid_until')} {applied.validUntil}</p>
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
            <p className="text-[10px] text-muted-foreground">{t('try_codes')}: WELCOME50, SAVE20, FLAT10</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentMethodSelector({ selected, onSelect }: { selected: PaymentMethod; onSelect: (m: PaymentMethod) => void }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />{t('payment_method')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-smooth cursor-pointer ${selected === method.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
            >
              <span className="text-lg">{method.icon}</span>
              <span className="text-xs font-medium">{method.name}</span>
              {selected === method.id && <Check className="w-3.5 h-3.5 text-primary ms-auto" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Checkout Dialog
// ============================================================

function CheckoutDialog({
  open, onClose, plan, isYearly, discount, paymentMethod
}: {
  open: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  isYearly: boolean;
  discount: number;
  paymentMethod: PaymentMethod;
}) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  if (!plan) return null;

  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100) * 100) / 100 : price;
  const billingPeriod = isYearly ? t('year') : t('month');

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
            <Shield className="w-5 h-5 text-primary" />
            {t('checkout')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>{plan.icon}</div>
                <div>
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t('billed')} {billingPeriod}</p>
                </div>
              </div>
              <div className="text-end">
                {discount > 0 && <p className="text-xs text-muted-foreground line-through">${price}/{billingPeriod}</p>}
                <p className="text-lg font-bold">${discountedPrice}<span className="text-xs text-muted-foreground">/{billingPeriod}</span></p>
              </div>
            </div>
            {plan.trialDays > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded px-2 py-1">
                <Clock className="w-3 h-3" />
                <span>{plan.trialDays} {t('day_free_trial')} — {t('no_charge_until_trial_ends')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <span className="text-lg">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.icon}</span>
              <span className="text-sm font-medium">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{t('selected')}</Badge>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200">
              <div className="flex items-center gap-1 text-green-700 text-xs"><Percent className="w-3 h-3" />{t('discount_applied')}</div>
              <span className="text-xs font-semibold text-green-700">-{discount}%</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">{t('total')}</span>
            <span className="text-xl font-bold">${discountedPrice}</span>
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
// Current Plan Info
// ============================================================

function CurrentPlanInfo({ role }: { role: 'job_seeker' | 'company' }) {
  const { t } = useTranslation();

  const seekerInfo = {
    plan: 'Plus',
    cycle: t('monthly'),
    nextBilling: 'Aug 1, 2026',
    amount: '$14.99/mo',
  };

  const companyInfo = {
    plan: 'Professional',
    cycle: t('yearly'),
    nextBilling: 'Aug 1, 2026',
    amount: '$39/mo ($468/yr)',
  };

  const info = role === 'job_seeker' ? seekerInfo : companyInfo;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{t('current_period')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('plan')}</span><span className="font-medium">{info.plan}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('billing_cycle')}</span><span className="font-medium">{info.cycle}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('next_billing_date')}</span><span className="font-medium">{info.nextBilling}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('amount')}</span><span className="font-medium">{info.amount}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{t('status')}</span><Badge className="text-[10px] bg-green-600">{t('active')}</Badge></div>
        <div className="pt-3 border-t flex gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer text-xs flex-1">{t('change_plan')}</Button>
          <Button variant="outline" size="sm" className="cursor-pointer text-xs text-destructive flex-1">{t('cancel_subscription')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Subscription Page (Role-Aware)
// ============================================================

export default function Subscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuthStore();

  // Determine effective role for subscription display
  const effectiveRole: 'job_seeker' | 'company' = userRole === 'company' ? 'company' : 'job_seeker';
  const backFallback = userRole === 'company' ? '/company' : userRole === 'admin' ? '/admin' : '/seeker';

  // Role-specific data
  const plans = effectiveRole === 'company' ? COMPANY_PLANS : SEEKER_PLANS;
  const featureComparison = effectiveRole === 'company' ? COMPANY_FEATURE_COMPARISON : SEEKER_FEATURE_COMPARISON;
  const planNames = effectiveRole === 'company' ? ['Starter', 'Professional', 'Business', 'Enterprise'] : ['Free', 'Premium', 'Premium+'];
  const invoices = effectiveRole === 'company' ? COMPANY_INVOICES : SEEKER_INVOICES;
  const currentPlanId = effectiveRole === 'company' ? 'company_professional' : 'seeker_plus';

  const [isYearly, setIsYearly] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('stripe');
  const [discount, setDiscount] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Block admin from accessing this page directly (they use /admin/subscriptions)
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
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (plan.monthlyPrice === -1) {
      toast.info(t('contact_sales_message'));
      return;
    }
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
              <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <button onClick={() => setIsYearly(false)} className={`px-3 py-1 rounded-full text-xs font-medium transition-smooth cursor-pointer ${!isYearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('monthly')}</button>
                <button onClick={() => setIsYearly(true)} className={`px-3 py-1 rounded-full text-xs font-medium transition-smooth cursor-pointer ${isYearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('yearly')} <span className="text-green-600">-20%</span></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="plans">{t('plans')}</TabsTrigger>
            <TabsTrigger value="usage">{t('usage')}</TabsTrigger>
            <TabsTrigger value="billing">{t('billing')}</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-8">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isYearly={isYearly}
                  currentPlan={currentPlanId}
                  onSelect={handleSelectPlan}
                  appliedDiscount={discount}
                />
              ))}
            </div>
            <FeatureComparison features={featureComparison} planNames={planNames} />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageTracker role={effectiveRole} />
              <CurrentPlanInfo role={effectiveRole} />
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentMethodSelector selected={selectedPayment} onSelect={setSelectedPayment} />
              <CouponInput onApply={setDiscount} />
            </div>
            <InvoiceList invoices={invoices} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        plan={checkoutPlan}
        isYearly={isYearly}
        discount={discount}
        paymentMethod={selectedPayment}
      />
    </div>
  );
}