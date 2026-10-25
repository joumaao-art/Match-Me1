import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { safeViaReturn } from '@/lib/via-premium';
import { ViaPremiumPage } from './ViaPremiumPage';

export function DesktopSeekerSubscription() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const ar = i18n.language.startsWith('ar');
  const back = safeViaReturn(new URLSearchParams(location.search).get('return'));
  return <main dir={ar ? 'rtl' : 'ltr'} className="min-h-dvh bg-background">
    <header className="border-b px-6 py-4 flex items-center gap-3">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(back)}><ArrowLeft size={18} className="rtl:rotate-180"/>{ar ? 'العودة' : 'Back'}</Button>
      <span className="font-semibold">MatchMe · VIA Premium</span>
    </header>
    <div className="max-w-4xl mx-auto p-8"><ViaPremiumPage desktop/></div>
  </main>;
}
