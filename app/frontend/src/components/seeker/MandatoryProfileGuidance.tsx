import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMandatoryProfile } from '@/lib/mandatory-profile';
import { Button } from '@/components/ui/button';

export function MandatoryProfileGuidance() {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const navigate=useNavigate();const {checklist,percentage}=useMandatoryProfile();
 const names:Record<string,[string,string]>={PERSONAL_DETAILS:['Personal details','البيانات الشخصية'],GENDER:['Gender','الجنس'],BIRTHDAY:['Birthday','تاريخ الميلاد'],CURRENT_LOCATION:['Current location','الموقع الحالي'],SKILLS:['Skills','المهارات'],EDUCATION:['Education','التعليم'],EXPERIENCE:['Experience','الخبرة'],PREFERENCES:['Preferences','التفضيلات'],SENIORITY:['Seniority','مستوى الخبرة']};
 const missing=checklist?.filter(x=>!x.completed)||[];
 return <section className="border rounded-lg p-3 space-y-2"><p className="text-sm font-medium">{ar?'اكتمال المعلومات المطلوبة':'Required profile completion'}: {percentage===null?'—':`${percentage}%`}</p>{missing.length>0&&<><p className="text-xs text-muted-foreground">{ar?'أكمل الأقسام التالية للتقدم للوظائف.':'Complete these sections to apply for jobs.'}</p><div className="flex flex-wrap gap-2">{missing.map(x=><Button key={x.step} variant="outline" className="!bg-transparent min-h-11" onClick={()=>navigate(`/seeker/onboarding?repair=1#${x.step}`)}>{names[x.step][ar?1:0]}</Button>)}</div></>}</section>;
}
