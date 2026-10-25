import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
export function SeekerInvitationsView() {
 const {t,i18n}=useTranslation();const navigate=useNavigate();const ar=i18n.language.startsWith('ar');
 return <div className="flex-1 p-4 sm:p-6 overflow-y-auto"><h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2 mb-6"><Mail className="w-5 h-5 text-primary"/>{t('invitations')}</h2><Card className="max-w-4xl"><CardContent className="p-5 space-y-4"><p className="text-sm">{ar?'راجع دعوات المقابلات الفعلية وردّ عليها في محادثات الشركة المصرح بها.':'Review and respond to actual interview invitations in authorized Company conversations.'}</p><Button onClick={()=>navigate('/messages')}>{t('messages')}</Button><p role="status" className="text-sm text-muted-foreground">{ar?'دعوات التقديم المنفصلة غير مُعدّة. لا توجد دعوات أو عروض تجريبية معروضة.':'Separate invitations to apply are not configured. No demo invitations or offers are displayed.'}</p></CardContent></Card></div>;
}
export function SeekerCareerAnalyticsView() {
 const {i18n}=useTranslation();return <p className="p-6 text-sm text-muted-foreground">{i18n.language.startsWith('ar')?'إحصاءات مشاهدة الملف غير مُعدّة.':'Profile-view analytics are not configured.'}</p>;
}
