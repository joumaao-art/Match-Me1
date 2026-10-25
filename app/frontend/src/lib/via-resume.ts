import { jsPDF } from 'jspdf';
import { countryLabel, sortChronological, sortCertificates, normalizeYearMonth } from '@/lib/profile-standards';
import type { loadResumeData } from '@/services/mobile-account';

export type ResumeData = Awaited<ReturnType<typeof loadResumeData>>;
export interface ResumeBlock { text: string; kind: 'name' | 'heading' | 'body' }
const clean=(v: unknown)=>typeof v==='string'?v.trim():'';
export function resumeBlocks(data:ResumeData,lang:string):ResumeBlock[] {
 const ar=lang.startsWith('ar'); const c=(en:string,arabic:string)=>ar?arabic:en;
 const p=data.account.profile; const name=[clean(p.first_name),clean(p.last_name)].filter(Boolean).join(' ');
 if(!clean(p.first_name)||!clean(p.last_name)||!data.account.email)throw new Error(c('Add your legal first and family names and registered email before generating.','أضف الاسم القانوني الأول واسم العائلة والبريد المسجل قبل إنشاء السيرة.'));
 const blocks:ResumeBlock[]=[{text:name,kind:'name'}];
 const body=(text:string)=>{if(text.trim())blocks.push({text,kind:'body'});};
 const heading=(en:string,arabic:string)=>blocks.push({text:c(en,arabic),kind:'heading'});
 const date=(value:string)=>{const v=normalizeYearMonth(value);if(!v)return '';const [y,m]=v.split('-');return m?new Intl.DateTimeFormat(ar?'ar':'en',{month:'short',year:'numeric',numberingSystem:'latn'}).format(new Date(Number(y),Number(m)-1,1)):y;};
 const range=(x:{from:string;to:string;current:boolean})=>[date(x.from),x.current?c('Present','حتى الآن'):date(x.to)].filter(Boolean).join(' – ');
 body(data.account.email);body(clean(p.phone));body(clean(p.city));body(countryLabel(p.country||'',lang));
 if(data.experience.length){heading('Professional Experience','الخبرة المهنية');for(const x of sortChronological(data.experience)){body(x.title);body(x.company);body(range(x));body(x.city);body(countryLabel(x.country,lang));body(x.description);}}
 if(data.education.length){heading('Education','التعليم');for(const x of sortChronological(data.education)){body(x.institution);body(x.degree?.replace(/_/g,' ')||'');body(x.field);body(range(x));body(x.city||'');body(countryLabel(x.country||'',lang));}}
 const skills=(p.skills||[]).map(clean).filter(Boolean);if(skills.length){heading('Skills','المهارات');body(skills.join(', '));}
 const certificates=p.professional_details?.certificates||[];
 if(certificates.length){heading('Certifications','الشهادات');for(const x of sortCertificates(certificates)){body(x.name);body(x.issuer);body(date(x.date));body(x.credentialId||'');}}
 const languages=p.professional_details?.languages;
 if(languages?.length){heading('Languages','اللغات');for(const x of languages)body([x.name,x.level?c(x.level,({beginner:'مبتدئ',intermediate:'متوسط',fluent:'طليق',native:'لغة أم'} as Record<string,string>)[x.level]||x.level):''].filter(Boolean).join(' — '));}
 else if(p.languages?.length){heading('Languages','اللغات');body(p.languages.map(clean).filter(Boolean).join(', '));}
 return blocks;
}
let fontPromise:Promise<string>|null=null;
async function loadFont(){
 fontPromise??=fetch('/fonts/Amiri-Regular.ttf',{signal:AbortSignal.timeout(15000)}).then(async r=>{if(!r.ok)throw new Error('Resume font unavailable');const bytes=new Uint8Array(await r.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}).catch(e=>{fontPromise=null;throw e;});return fontPromise;
}
export function renderResume(blocks:ResumeBlock[],font:string){
 const doc=new jsPDF({unit:'mm',format:'a4'});doc.addFileToVFS('Amiri-Regular.ttf',font);doc.addFont('Amiri-Regular.ttf','Amiri','normal');doc.setFont('Amiri','normal');doc.setTextColor(25,35,48);let y=20;
 for(const block of blocks){
  const size=block.kind==='name'?22:block.kind==='heading'?15:12;const leading=size*0.48;
  doc.setFontSize(size);if(block.kind==='heading')y+=5;
  const lines=doc.splitTextToSize(block.text,170) as string[];
  for(const line of lines){if(y+leading>278){doc.addPage();y=20;}const rtl=/[\u0600-\u06ff]/.test(line);doc.text(line,rtl?190:20,y,{align:rtl?'right':'left',isInputVisual:false,isOutputVisual:true,isInputRtl:rtl,isOutputRtl:false});y+=leading;}
  y+=block.kind==='name'?3:1;
 }
 doc.setProperties({title:'VIA Resume',subject:'Professional resume',creator:'MatchMe'});return doc;
}
export async function generateResume(data:ResumeData,lang:string){
 const doc=renderResume(resumeBlocks(data,lang),await loadFont());
 const name=[data.account.profile.first_name,data.account.profile.last_name].join('_').replace(/[^\p{L}\p{N}_-]/gu,'_');
 return {blob:doc.output('blob'),filename:`${name}_VIA_Resume.pdf`};
}
