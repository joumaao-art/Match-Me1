import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SignupMethodButton } from './OnboardingKit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function MobileEntry({onMethod,onLogin,busy=false}:{onMethod:(kind:'apple'|'google'|'phone'|'email')=>void;onLogin:()=>void;busy?:boolean}) {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const [legal,setLegal]=useState<'privacy'|'terms'|null>(null);
 return <main className="min-h-[100dvh] bg-background flex flex-col px-6 pt-12 pb-8" style={{paddingTop:'calc(env(safe-area-inset-top) + 48px)',paddingBottom:'calc(env(safe-area-inset-bottom) + 24px)'}}>
 <div className="text-center"><div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto"><Sparkles size={28}/></div><p className="text-xl font-bold mt-3 font-[Poppins]">MatchMe</p></div>
 <section className="mt-12 mb-8 text-center"><h1 className="text-2xl font-semibold tracking-tight">{ar?'مرحباً بك في MatchMe':'Welcome to MatchMe'}</h1><p className="mt-2 text-base text-muted-foreground">Get Hired VIA us</p></section>
 <div className="space-y-3 w-full max-w-sm mx-auto">{(['apple','google','phone','email'] as const).map(kind=><SignupMethodButton key={kind} kind={kind} onClick={()=>onMethod(kind)} disabled={busy}/>)}</div>
 <p className="mt-3 text-center text-sm font-normal">{ar?'لديك حساب بالفعل؟':'Already have an account?'}{' '}<button type="button" className="min-h-11 px-1 font-bold text-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={onLogin}>{ar?'تسجيل الدخول':'Login'}</button></p>
 <footer className="mt-auto pt-8 max-w-sm mx-auto text-center text-xs text-muted-foreground leading-6">{ar?'بالمتابعة، فإنك توافق على':'By continuing, you agree to our'}{' '}<button className="text-foreground underline underline-offset-4 min-h-11" onClick={()=>setLegal('privacy')}>{ar?'سياسة الخصوصية':'Privacy Policy'}</button>{ar?' و ':' and '}<button className="text-foreground underline underline-offset-4 min-h-11" onClick={()=>setLegal('terms')}>{ar?'الشروط والأحكام':'Terms & Conditions'}</button>.</footer>
 <Dialog open={!!legal} onOpenChange={v=>{if(!v)setLegal(null);}}><DialogContent className="rounded-t-2xl bottom-0 top-auto translate-y-0 max-h-[85dvh] overflow-y-auto w-full max-w-lg"><DialogHeader><DialogTitle>{legal==='privacy'?(ar?'سياسة الخصوصية':'Privacy Policy'):(ar?'الشروط والأحكام':'Terms & Conditions')}</DialogTitle><DialogDescription>{ar?'يلزم إعداد المحتوى القانوني المعتمد قبل الإطلاق.':'Approved legal content must be configured before release.'}</DialogDescription></DialogHeader><p className="text-sm leading-7">{ar?'لم يتم العثور على نص قانوني معتمد في المصدر الحالي. لا تُعرض شروط مؤقتة على أنها معتمدة.':'No approved current legal document is configured in the canonical application source. No placeholder terms are being presented as approved.'}</p><Button className="h-12 w-full" onClick={()=>setLegal(null)}>{ar?'إغلاق':'Close'}</Button></DialogContent></Dialog>
 </main>;
}
