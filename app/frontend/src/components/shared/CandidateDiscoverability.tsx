import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, MessageSquare, BarChart3 } from 'lucide-react';

export type SeekerTier = 'free' | 'premium' | 'premium_plus';
export type VisibilityMode = 'public' | 'anonymous' | 'private';
export type ContactRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';
function CapabilityNotice({title,children}:{title:string;children:React.ReactNode}) {
 return <div className="flex-1 p-4 sm:p-6 overflow-y-auto"><h2 className="text-xl font-bold font-[Poppins] mb-6">{title}</h2><Card className="max-w-2xl"><CardContent className="p-6 space-y-4">{children}</CardContent></Card></div>;
}
export function ProfileVisibilitySettings(_props:{tier:SeekerTier}) {
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');
 return <CapabilityNotice title={t('profile_visibility')}><Shield className="w-8 h-8 text-primary"/><p className="text-sm">{ar?'بيانات الاتصال والسيرة الخاصة محمية بصلاحيات حسابك. تحصل الشركة المالكة للوظيفة على معلومات طلب التوظيف المصرح بها فقط.':'Private contact and CV data are protected by account permissions. The vacancy-owning Company receives only its authorized application information.'}</p><p role="status" className="text-sm text-muted-foreground">{ar?'أوضاع الدليل العام والمجهول والخاص وإخفاء صاحب العمل غير مُعدّة على الخادم. لا نعرض مفاتيح وهمية ولا ندّعي أن الاشتراك يفعّلها.':'Public, anonymous and private directory modes and employer hiding are not implemented by the server. No simulated toggles are shown, and a subscription is not claimed to enable them.'}</p></CapabilityNotice>;
}
export function ContactRequestsView(_props:{tier:SeekerTier}) {
 const {t,i18n}=useTranslation();const navigate=useNavigate();const ar=i18n.language.startsWith('ar');
 return <CapabilityNotice title={t('contact_requests')}><MessageSquare className="w-8 h-8 text-primary"/><p className="text-sm">{ar?'تواصل الشركات المصرح به ودعوات المقابلات متاحان في الرسائل. تبدأ الشركة المالكة للوظيفة المحادثة بعد تقديمك.':'Authorized Company contact and interview invitations are available in Messages. The vacancy-owning Company initiates contact after your application.'}</p><Button onClick={()=>navigate('/messages')}>{t('messages')}</Button><p className="text-xs text-muted-foreground">{ar?'دعوات التقديم المستقلة من دليل المرشحين غير مُعدّة.':'Separate candidate-directory invitations to apply are not configured.'}</p></CapabilityNotice>;
}
export function ExposureDashboard(_props:{tier:SeekerTier}) {
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');
 return <CapabilityNotice title={t('exposure_dashboard')}><BarChart3 className="w-8 h-8 text-primary"/><p role="status" className="text-sm text-muted-foreground">{ar?'جمع أحداث مشاهدة الملف وظهوره في البحث غير مُعدّ. لا توجد إحصاءات موثقة لعرضها؛ لم نستبدلها بأرقام تجريبية.':'Profile-view and search-impression event collection is not configured. There are no verified analytics to display; no demo numbers are substituted.'}</p></CapabilityNotice>;
}
export function RecruiterVisibilityView(props:{tier:SeekerTier}) { return <ExposureDashboard {...props}/>; }
export function DiscoverabilityUpgradeBanner() { return null; }
export function DiscoverabilityNotifications(_props:{tier:SeekerTier}) { return null; }
