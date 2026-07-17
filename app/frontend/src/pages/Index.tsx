import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { changeLanguage } from '@/lib/i18n';
import { useAuth } from '@/App';
import { Brain, Sparkles, Shield, ArrowRight, Globe, Moon, Sun, UserCircle, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function Index() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

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
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[Poppins] tracking-tight text-foreground mb-6">
              {t('tagline')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 cursor-pointer">
                {t('get_started')}
                <ArrowRight className="w-5 h-5 ms-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 cursor-pointer">
                {t('learn_more')}
              </Button>
            </div>
          </div>

          {/* Role Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="group hover:shadow-lg transition-smooth cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate('/auth?role=job_seeker')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-smooth">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-[Poppins] mb-2">{t('job_seeker')}</h3>
                <p className="text-muted-foreground">{t('job_seeker_desc')}</p>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-smooth cursor-pointer border-2 hover:border-primary/50" onClick={() => navigate('/auth?role=company')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-smooth">
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold font-[Poppins] mb-2">{t('company')}</h3>
                <p className="text-muted-foreground">{t('company_desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('feature_matching')}</h3>
              <p className="text-muted-foreground text-sm">{t('feature_matching_desc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('feature_swipe')}</h3>
              <p className="text-muted-foreground text-sm">{t('feature_swipe_desc')}</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('feature_secure')}</h3>
              <p className="text-muted-foreground text-sm">{t('feature_secure_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-[Poppins] text-center mb-12">{t('how_it_works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('step1_title'), desc: t('step1_desc') },
              { num: '02', title: t('step2_title'), desc: t('step2_desc') },
              { num: '03', title: t('step3_title'), desc: t('step3_desc') },
            ].map((step) => (
              <div key={step.num} className="relative p-6">
                <span className="text-6xl font-bold font-[Poppins] text-primary/10 absolute top-0 start-4">
                  {step.num}
                </span>
                <div className="pt-12">
                  <h3 className="text-lg font-semibold font-[Poppins] mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
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