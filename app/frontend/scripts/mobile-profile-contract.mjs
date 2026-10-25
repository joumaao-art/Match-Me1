import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
globalThis.WebSocket=class{static OPEN=1;static CONNECTING=0;static CLOSED=3;};
globalThis.window={atob:globalThis.atob,btoa:globalThis.btoa,console,location:{origin:'https://example.com'},dispatchEvent:()=>{}};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
const server=await createServer({server:{middlewareMode:true},appType:'custom'});let count=0;
const test=(name,fn)=>{fn();count++;console.log(`PASS ${name}`);};
try{
 const {resumeBlocks,renderResume}=await server.ssrLoadModule('/src/lib/via-resume.ts');
 const {personalDraft,personalPatch,cvOwnerPath}=await server.ssrLoadModule('/src/services/mobile-account.ts');
 const {activeSeekerMobileTab,seekerSection}=await server.ssrLoadModule('/src/lib/seeker-navigation.ts');
 const profile={first_name:'Alex',last_name:'Example',phone:'+966512345678',country:'SA',city:'Riyadh',date_of_birth:'1990-01-01',gender:'male',skills:['JavaScript'],languages:['Arabic'],professional_details:{certificates:[{id:'older',name:'Old certificate',issuer:'Issuer',date:'2020',verified:false},{id:'newer',name:'New certificate',issuer:'Issuer',date:'2025-03',verified:false}]}};
 const data={account:{profile,email:'alex@example.com'},experience:[{id:'old',title:'Older role',company:'Example',from:'2010',to:'2012',current:false,country:'',city:'',description:'Actual duties'},{id:'new',title:'Current role',company:'Example',from:'2020-01',to:'',current:true,country:'',city:'',description:'Latest duties'}],education:[{id:'e1',institution:'Older School',from:'2000',to:'2004',current:false,degree:'BACHELOR',field:'Computing'},{id:'e2',institution:'Newer School',from:'2020-01',to:'2022-02',current:false,degree:'MASTER',field:'Computing'}]};
 const blocks=resumeBlocks(data,'en');const text=blocks.map(b=>b.text).join('\n');
 test('uses actual identity and contact',()=>{assert.ok(text.includes('Alex Example'));assert.ok(text.includes('alex@example.com'));assert.ok(text.includes('+966512345678'));});
 test('sensitive fields and invented summary excluded',()=>{assert.ok(!text.includes('1990-01-01'));assert.ok(!text.includes('male'));assert.ok(!text.includes('Summary'));});
 test('experience chronological',()=>assert.ok(text.indexOf('Current role')<text.indexOf('Older role')));
 test('education chronological',()=>assert.ok(text.indexOf('Newer School')<text.indexOf('Older School')));
 test('certifications chronological',()=>assert.ok(text.indexOf('New certificate')<text.indexOf('Old certificate')));
 test('year-only date not fabricated',()=>{assert.ok(text.includes('2010 – 2012'));assert.ok(!text.includes('Jan 2010'));});
 test('missing essential identity rejected',()=>assert.throws(()=>resumeBlocks({...data,account:{...data.account,profile:{...profile,first_name:''}}},'en')));
 test('empty optional sections omitted',()=>{const b=resumeBlocks({...data,experience:[],education:[],account:{...data.account,profile:{...profile,skills:[],languages:[],professional_details:{}}}},'en');assert.equal(b.length,5);});
 test('personal patch changes only edited fields',()=>{const d=personalDraft(profile);d.first_name='New';assert.deepEqual(personalPatch(profile,d),{first_name:'New'});});
 test('unchanged personal draft writes nothing',()=>assert.deepEqual(personalPatch(profile,personalDraft(profile)),{}));
 test('CV foreign and traversal paths rejected',()=>{assert.equal(cvOwnerPath('other/file.pdf','owner'),null);assert.equal(cvOwnerPath('owner/../file.pdf','owner'),null);assert.equal(cvOwnerPath('https://evil.com/storage/v1/object/public/cvs/owner/a.pdf','owner'),null);assert.equal(cvOwnerPath('owner/a.pdf','owner'),'owner/a.pdf');});
 for(const section of ['personal','via_resume','subscription_overview','support','faq','report','account_settings'])test(`profile navigation ${section}`,()=>{assert.equal(activeSeekerMobileTab(section),'profile');assert.equal(seekerSection('/seeker',`?view=${section}`),section);});
 const font=(await readFile('public/fonts/Amiri-Regular.ttf')).toString('base64');
 for(const lang of ['en','ar']){const d=lang==='en'?data:{...data,account:{...data.account,profile:{...profile,first_name:'أحمد',last_name:'حسن'}},experience:[{...data.experience[0],title:'مهندس برمجيات',description:'تطوير تطبيقات الويب'}]};const doc=renderResume(resumeBlocks(d,lang),font);const bytes=Buffer.from(doc.output('arraybuffer'));test(`${lang} actual PDF output`,()=>{assert.ok(bytes.length>10000);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.toString('latin1').includes('/ToUnicode'));});await writeFile(`scripts/artifacts/profile-resume-${lang}.pdf`,bytes);}
 const ui=await readFile('src/components/seeker/MobileProfileAccount.tsx','utf8');const support=await readFile('src/components/seeker/MobileSupport.tsx','utf8');const route=await readFile('src/pages/JobSeeker.tsx','utf8');
 test('overview three ordered primary actions',()=>assert.ok(ui.indexOf("label={copy('Subscription Overview'")<ui.indexOf('label="VIA Resume"')&&ui.indexOf('label="VIA Resume"')<ui.indexOf("label={copy('Personal'")));
 test('canonical desktop profile route retained',()=>assert.ok(route.includes("if (isMobile && MOBILE_ACCOUNT_SECTIONS.includes(activeTab))")&&route.includes('return <MobileProfileAccount section={activeTab}/>')&&route.includes('return <DesktopProfileAccount')));
 test('no fabricated mobile account identity',()=>{assert.ok(!route.includes('userName="Ahmed Hassan"'));assert.ok(ui.includes('account.email'));assert.ok(ui.includes('account.displayName'));});
 test('support config and persisted reports',()=>{assert.ok(support.includes('VITE_MATCHME_SUPPORT_EMAIL'));assert.ok(support.includes('VITE_MATCHME_SUPPORT_CHAT_URL'));assert.ok(support.includes('await submitReport'));assert.ok(!support.includes('support@matchme.com'));});
 console.log(`${count} Profile contracts passed.`);
}finally{await server.close();}
