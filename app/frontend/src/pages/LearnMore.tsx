/**
 * Learn More page - Marketing page explaining MatchMe platform.
 * Covers: What it is, How it works, Benefits, AI Matching, Security, FAQ, CTA.
 * Fully bilingual (EN/AR), responsive, SEO-optimized.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { changeLanguage } from '@/lib/i18n';
import { useAuth } from '@/App';
import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Sparkles, Shield, ArrowRight, Globe, Moon, Sun,
  UserCircle, Building2, CheckCircle2, ChevronDown, ChevronUp,
  Zap, MessageSquare, Bell, FileText, BarChart3, Smartphone,
  Lock, Eye, Server, Users, Briefcase, GraduationCap,
  MapPin, Target, TrendingUp, Clock, Award, Languages
} from 'lucide-react';

// ============================================================
// FAQ ACCORDION COMPONENT
// ============================================================

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/30">
      <button
        className="w-full flex items-center justify-between p-5 text-start cursor-pointer bg-card hover:bg-muted/50 transition-colors"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-foreground font-[Poppins] pe-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-muted-foreground leading-relaxed bg-card">
          {answer}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP CARD COMPONENT
// ============================================================

function StepCard({ number, title, icon: Icon }: { number: number; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-bold text-primary">{number}</span>
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-primary/70 shrink-0" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE CARD COMPONENT
// ============================================================

function FeatureCard({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 border-2">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-medium text-foreground text-sm">{title}</span>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN LEARN MORE PAGE
// ============================================================

export default function LearnMore() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // SEO meta tags
  useEffect(() => {
    document.title = t('lm_meta_title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', t('lm_meta_description'));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t('lm_meta_description');
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTags = [
      { property: 'og:title', content: t('lm_meta_title') },
      { property: 'og:description', content: t('lm_meta_description') },
      { property: 'og:type', content: 'website' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: t('lm_meta_title') },
      { property: 'twitter:description', content: t('lm_meta_description') },
    ];

    ogTags.forEach(({ property, content }) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    });
  }, [t, i18n.language]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const handleGetStarted = () => {
    if (user && userRole) {
      navigate(userRole === 'company' ? '/company' : '/seeker');
    } else {
      navigate('/auth?role=job_seeker');
    }
  };

  const handleCompanySignup = () => {
    navigate('/auth?role=company');
  };

  // Seeker steps icons
  const seekerStepIcons = [UserCircle, FileText, Target, Brain, Building2, CheckCircle2, MessageSquare, Award];
  // Company steps icons
  const companyStepIcons = [Building2, FileText, Briefcase, Brain, Target, CheckCircle2, MessageSquare, Users];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-[Poppins]">{t('app_name')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLang} className="cursor-pointer" aria-label={t('language')}>
              <Globe className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDark} className="cursor-pointer" aria-label={isDark ? t('light_mode') : t('dark_mode')}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <Button onClick={handleGetStarted} className="cursor-pointer">
                {t('dashboard')}
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} className="cursor-pointer">
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 start-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 end-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              {t('lm_badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[Poppins] tracking-tight text-foreground mb-6 leading-tight">
              {t('lm_hero_title')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto">
              {t('lm_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 cursor-pointer">
                {t('get_started')}
                <ArrowRight className="w-5 h-5 ms-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleCompanySignup} className="text-lg px-8 py-6 cursor-pointer">
                <Building2 className="w-5 h-5 me-2" />
                {t('lm_create_company')}
              </Button>
            </div>
          </div>

          {/* AI Illustration */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border p-8 sm:p-12">
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('job_seeker')}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                    <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-primary">{t('lm_ai_engine')}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/20 flex items-center justify-center">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('company')}</span>
                </div>
              </div>
              {/* Connection lines */}
              <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-accent/30 -translate-y-4 hidden sm:block" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================================ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_how_title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('lm_how_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Job Seekers Steps */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-[Poppins] text-foreground">{t('lm_how_seekers_title')}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <StepCard
                    key={`seeker-${i}`}
                    number={i + 1}
                    title={t(`lm_seeker_step_${i + 1}`)}
                    icon={seekerStepIcons[i]}
                  />
                ))}
              </div>
            </div>

            {/* Companies Steps */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold font-[Poppins] text-foreground">{t('lm_how_companies_title')}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <StepCard
                    key={`company-${i}`}
                    number={i + 1}
                    title={t(`lm_company_step_${i + 1}`)}
                    icon={companyStepIcons[i]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WHY MATCHME - FEATURES */}
      {/* ============================================================ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_why_title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('lm_why_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'lm_feature_ai', icon: Brain },
              { key: 'lm_feature_swipe', icon: Target },
              { key: 'lm_feature_bilingual', icon: Languages },
              { key: 'lm_feature_messaging', icon: MessageSquare },
              { key: 'lm_feature_pipeline', icon: Users },
              { key: 'lm_feature_dashboard', icon: BarChart3 },
              { key: 'lm_feature_alerts', icon: Bell },
              { key: 'lm_feature_resume', icon: FileText },
              { key: 'lm_feature_profile', icon: TrendingUp },
              { key: 'lm_feature_notifications', icon: Zap },
              { key: 'lm_feature_mobile', icon: Smartphone },
              { key: 'lm_feature_enterprise', icon: Server },
            ].map(({ key, icon }) => (
              <FeatureCard key={key} title={t(key)} icon={icon} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BENEFITS */}
      {/* ============================================================ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_benefits_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Job Seeker Benefits */}
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-[Poppins]">{t('lm_benefits_seekers_title')}</h3>
              </div>
              <ul className="space-y-4">
                {Array.from({ length: 7 }, (_, i) => (
                  <li key={`sb-${i}`} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{t(`lm_seeker_benefit_${i + 1}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Benefits */}
            <div className="bg-card rounded-2xl border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold font-[Poppins]">{t('lm_benefits_companies_title')}</h3>
              </div>
              <ul className="space-y-4">
                {Array.from({ length: 7 }, (_, i) => (
                  <li key={`cb-${i}`} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{t(`lm_company_benefit_${i + 1}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AI MATCHING EXPLANATION */}
      {/* ============================================================ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_ai_title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              {t('lm_ai_description')}
            </p>
          </div>

          {/* AI Flow Diagram */}
          <div className="max-w-md mx-auto">
            <div className="flex flex-col items-center gap-0">
              {[
                { key: 'lm_ai_flow_1', icon: UserCircle },
                { key: 'lm_ai_flow_2', icon: Brain },
                { key: 'lm_ai_flow_3', icon: Target },
                { key: 'lm_ai_flow_4', icon: Eye },
                { key: 'lm_ai_flow_5', icon: CheckCircle2 },
                { key: 'lm_ai_flow_6', icon: MessageSquare },
              ].map(({ key, icon: FlowIcon }, idx, arr) => (
                <div key={key} className="flex flex-col items-center">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border w-full max-w-xs hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FlowIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{t(key)}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-primary/20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECURITY & PRIVACY */}
      {/* ============================================================ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_security_title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('lm_security_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { key: 'lm_sec_auth', icon: Lock },
              { key: 'lm_sec_encrypted', icon: Shield },
              { key: 'lm_sec_privacy', icon: Eye },
              { key: 'lm_sec_roles', icon: Users },
              { key: 'lm_sec_messaging', icon: MessageSquare },
              { key: 'lm_sec_gdpr', icon: CheckCircle2 },
              { key: 'lm_sec_cloud', icon: Server },
            ].map(({ key, icon: SecIcon }) => (
              <div key={key} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <SecIcon className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-foreground">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ */}
      {/* ============================================================ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-4">
              {t('lm_faq_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <FAQItem
                key={`faq-${i}`}
                question={t(`lm_faq_q_${i + 1}`)}
                answer={t(`lm_faq_a_${i + 1}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CALL TO ACTION */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-[Poppins] text-foreground mb-6">
            {t('lm_cta_title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            {t('lm_cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 cursor-pointer">
              <UserCircle className="w-5 h-5 me-2" />
              {t('lm_cta_seeker')}
            </Button>
            <Button size="lg" variant="outline" onClick={handleCompanySignup} className="text-lg px-8 py-6 cursor-pointer">
              <Building2 className="w-5 h-5 me-2" />
              {t('lm_cta_company')}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 cursor-pointer">
              {t('lm_cta_signin')}
              <ArrowRight className="w-5 h-5 ms-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}