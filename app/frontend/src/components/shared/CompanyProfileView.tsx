import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores';
import { useCompanyMarketplace, type CompanyProfile } from '@/lib/company-marketplace';
import { toast } from 'sonner';

const empty={company_name:'',industry:'',website:'',contact_phone:'',country:'',city:'',size:'',founded_year:'',description:'',culture:'',logo_url:''};
function formOf(p:CompanyProfile){return Object.fromEntries(Object.keys(empty).map(k=>[k,String(p[k as keyof CompanyProfile]??'')])) as typeof empty;}
export default function CompanyProfileView(){
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const uid=useAuthStore(s=>s.userId);const state=useCompanyMarketplace();const [form,setForm]=useState(empty);const [busy,setBusy]=useState(false);const lock=useRef(false);const hydrated=useRef<string|null>(null);const fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{hydrated.current=null;setForm(empty);},[uid]);
 useEffect(()=>{if(state.profile&&hydrated.current!==state.profile.id){setForm(formOf(state.profile));hydrated.current=state.profile.id;}},[state.profile]);
 const save=async()=>{
  if(lock.current||!uid)return;
  if(!form.company_name.trim()){toast.error(copy('Company name is required.','اسم الشركة مطلوب.'));return;}
  if(form.website){try{const url=new URL(form.website);if(!['https:','http:'].includes(url.protocol))throw new Error();}catch{toast.error(copy('Enter a valid website URL.','أدخل رابط موقع صحيحاً.'));return;}}
  const year=form.founded_year?Number(form.founded_year):null;
  if(year!==null&&(!Number.isInteger(year)||year<1000||year>new Date().getFullYear())){toast.error(copy('Check the founded year.','تحقق من سنة التأسيس.'));return;}
  lock.current=true;setBusy(true);
  try{const result=await profileService.upsertCompanyProfile(uid,{...form,company_name:form.company_name.trim(),founded_year:year,location:[form.city,form.country].filter(Boolean).join(', '),updated_at:new Date().toISOString()});if(result.error||!result.data)throw new Error(result.error?.message||'Profile was not saved');if(useAuthStore.getState().userId!==uid)return;toast.success(t('profile_saved'));window.dispatchEvent(new Event('matchme:company-changed'));}
  catch(e){toast.error((e as Error).message);}finally{lock.current=false;setBusy(false);}
 };
 const upload=async(file?:File)=>{
  if(!file||!uid||lock.current)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2097152){toast.error(copy('Choose a PNG, JPEG or WebP logo up to 2 MB.','اختر شعار PNG أو JPEG أو WebP بحجم لا يتجاوز ٢ ميغابايت.'));return;}
  lock.current=true;setBusy(true);
  try{const result=await profileService.uploadLogo(uid,file);if(result.error||!result.data)throw new Error(result.error?.message||'Upload failed');const url=`${result.data.publicUrl}?v=${Date.now()}`;const saved=await profileService.upsertCompanyProfile(uid,{logo_url:url});if(saved.error||!saved.data)throw new Error(saved.error?.message||'Logo was not saved');if(useAuthStore.getState().userId!==uid)return;setForm(p=>({...p,logo_url:url}));toast.success(t('profile_saved'));window.dispatchEvent(new Event('matchme:company-changed'));}
  catch(e){toast.error((e as Error).message);}finally{lock.current=false;setBusy(false);if(fileInput.current)fileInput.current.value='';}
 };
 const labels:Record<string,string>={company_name:t('company_name'),industry:t('industry'),website:t('company_website'),contact_phone:t('company_phone'),country:t('country'),city:t('city'),size:t('company_size'),founded_year:t('founded_year')};
 return <div className="flex-1 p-4 sm:p-6 overflow-y-auto" dir={ar?'rtl':'ltr'}><h2 className="text-xl font-bold mb-6">{t('company_profile')}</h2>{state.loading?<p role="status">{t('loading')}</p>:state.error?<div role="alert"><p>{state.error}</p><Button onClick={()=>void state.refresh()}>{t('try_again')}</Button></div>:<Card className="max-w-2xl"><CardContent className="p-6"><form className="space-y-4" onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="space-y-4"><div className="flex gap-4 items-center"><div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">{form.logo_url?<img src={form.logo_url} alt={form.company_name} className="w-full h-full object-contain rounded-xl"/>:<Building2 className="text-primary" size={32}/>}</div><Button type="button" variant="outline" onClick={()=>fileInput.current?.click()}>{t('upload_logo')}</Button><input ref={fileInput} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])}/></div><div className="grid sm:grid-cols-2 gap-4">{Object.entries(labels).map(([key,label])=><label key={key} className="text-sm space-y-1"><span>{label}{key==='company_name'?' *':''}</span><Input required={key==='company_name'} type={key==='founded_year'?'number':key==='website'?'url':'text'} value={form[key as keyof typeof form]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></label>)}</div>{(['description','culture'] as const).map(key=><label key={key} className="block text-sm space-y-1"><span>{t(key==='description'?'company_description':'company_culture')}</span><Textarea rows={4} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></label>)}<Button type="submit">{busy?t('loading'):t('save')}</Button></fieldset></form></CardContent></Card>}</div>;
}
