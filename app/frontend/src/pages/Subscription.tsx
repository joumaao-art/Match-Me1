import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { ArrowLeft, Check, Crown, Zap, Shield, MessageSquare, Users, BarChart3, Star } from 'lucide-react';

export default function Subscription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan] = useState<'free' | 'premium'>('free');

  const handleUpgrade = () => {
    toast.success('Redirecting to checkout...');
    // In production, this would call the Stripe edge function
  };

  const freeFeatures = [
    { icon: Users, text: 'Limited job postings (3/month)' },
    { icon: MessageSquare, text: 'Message matched candidates only' },
    { icon: Shield, text: 'Hidden contact information' },
    { icon: BarChart3, text: 'Basic analytics' },
  ];

  const premiumFeatures = [
    { icon: Zap, text: 'Unlimited job postings' },
    { icon: MessageSquare, text: 'Message anyone directly' },
    { icon: Users, text: 'Full contact details visible' },
    { icon: BarChart3, text: 'Advanced analytics & reports' },
    { icon: Star, text: 'Priority ranking in search' },
    { icon: Crown, text: 'Export candidate data (CSV/PDF)' },
  ];

  const seekerFreeFeatures = [
    { icon: Zap, text: 'Unlimited swipes' },
    { icon: Shield, text: 'Basic profile visibility' },
    { icon: MessageSquare, text: 'Message matched companies' },
  ];

  const seekerPremiumFeatures = [
    { icon: Zap, text: 'Unlimited swipes + Undo' },
    { icon: Star, text: 'Priority profile visibility' },
    { icon: MessageSquare, text: 'Message any company' },
    { icon: BarChart3, text: 'Detailed analytics & insights' },
    { icon: Crown, text: 'AI profile enhancement' },
    { icon: Users, text: 'See who viewed your profile' },
  ];

  const isCompany = userRole === 'company';
  const activeFreeFeatures = isCompany ? freeFeatures : seekerFreeFeatures;
  const activePremiumFeatures = isCompany ? premiumFeatures : seekerPremiumFeatures;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(userRole === 'company' ? '/company' : '/seeker')} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold font-[Poppins]">{t('subscription')}</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('yearly')}
              <Badge variant="secondary" className="ms-2 text-xs">-20%</Badge>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className={`relative ${currentPlan === 'free' ? 'border-primary border-2' : ''}`}>
            {currentPlan === 'free' && (
              <Badge className="absolute -top-3 start-4">{t('current_plan')}</Badge>
            )}
            <CardHeader>
              <CardTitle className="font-[Poppins] flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" />
                {t('free_plan')}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground font-[Poppins]">$0</span>
                <span className="text-muted-foreground">{t('per_month')}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {activeFreeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <feature.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={`relative ${currentPlan === 'premium' ? 'border-primary border-2' : 'border-accent/50 border-2'}`}>
            {currentPlan === 'premium' && (
              <Badge className="absolute -top-3 start-4">{t('current_plan')}</Badge>
            )}
            <div className="absolute -top-3 end-4">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="font-[Poppins] flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                {t('premium_plan')}
              </CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground font-[Poppins]">
                  ${billingCycle === 'monthly' ? '49' : '39'}
                </span>
                <span className="text-muted-foreground">{t('per_month')}</span>
                {billingCycle === 'yearly' && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    Billed ${39 * 12}/year
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {activePremiumFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
              {currentPlan !== 'premium' && (
                <Button className="w-full cursor-pointer" onClick={handleUpgrade}>
                  <Crown className="w-4 h-4 me-2" />
                  {t('upgrade')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Secure payment powered by Stripe</p>
          <div className="flex justify-center gap-4 items-center">
            <div className="px-3 py-1.5 bg-muted rounded-md text-xs font-medium">Visa</div>
            <div className="px-3 py-1.5 bg-muted rounded-md text-xs font-medium">Mastercard</div>
            <div className="px-3 py-1.5 bg-muted rounded-md text-xs font-medium">Apple Pay</div>
            <div className="px-3 py-1.5 bg-muted rounded-md text-xs font-medium">Google Pay</div>
          </div>
        </div>
      </div>
    </div>
  );
}