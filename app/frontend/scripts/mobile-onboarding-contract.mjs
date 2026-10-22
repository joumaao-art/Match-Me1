import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Pure contract tests never open realtime connections; only browser API discovery is needed.
globalThis.WebSocket=class {static OPEN=1;static CONNECTING=0;static CLOSED=3;constructor(){throw new Error('Unexpected realtime connection in a pure contract test');}};
const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
globalThis.window={dispatchEvent:()=>{},location:{origin:'http://localhost:3000'}};
globalThis.CustomEvent=class {constructor(type){this.type=type;}};
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
let passed=0;
const test=(name,run)=>{run();passed++;console.log(`PASS ${name}`);};
try{
 const m=await server.ssrLoadModule('/src/lib/mobile-onboarding.ts');
 const p=await server.ssrLoadModule('/src/lib/job-preferences.ts');
 const standards=await server.ssrLoadModule('/src/lib/profile-standards.ts');
 const legacy=await server.ssrLoadModule('/src/lib/onboarding-engine.ts');
 test('exact eleven semantic steps',()=>assert.deepEqual(m.MOBILE_STEPS,['PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS']));
 test('new account starts at uncounted intro',()=>assert.equal(m.emptyMobileState().screen,'INTRO'));
 test('empty personal data rejected without requiring CV',()=>{const e=m.validateMobile('PERSONAL_DETAILS',m.emptyMobileState().draft);assert.ok(e.firstName&&e.lastName&&e.email&&e.mobile);assert.equal(e.cvUrl,undefined);});
 for(const birthday of ['','not-a-date','2000-02-30','2099-01-01','2000-00-12'])test(`birthday rejects ${birthday||'empty'}`,()=>assert.ok(m.validateMobile('BIRTHDAY',{...m.emptyMobileState().draft,birthday}).birthday));
 test('leap birthday accepted',()=>assert.deepEqual(m.validateMobile('BIRTHDAY',{...m.emptyMobileState().draft,birthday:'2000-02-29'}),{}));
 const education={id:'stable',institution:'Example University',degree:'BACHELOR',field:'Computer Science',country:'GB',city:'London',from:'2020-02',to:'2024-03',current:false};
 test('education chronological validation',()=>assert.ok(m.validateMobile('EDUCATION',{...m.emptyMobileState().draft,educations:[{...education,to:'2019-01'}]})['stable.to']));
 test('current student preserves expected graduation',()=>assert.equal(standards.normalizeEducation({...education,current:true,to:'2028-06'}).to,'2028-06'));
 test('expected graduation cannot precede start',()=>assert.ok(m.validateMobile('EDUCATION',{...m.emptyMobileState().draft,educations:[{...education,current:true,to:'2019-01'}]})['stable.to']));
 test('explicit no-experience accepts empty history',()=>assert.deepEqual(m.validateMobile('EXPERIENCE',{...m.emptyMobileState().draft,noExperience:true}),{}));
 test('empty experience requires declaration',()=>assert.ok(m.validateMobile('EXPERIENCE',m.emptyMobileState().draft).experiences));
 test('keywords and work styles stay distinct',()=>{const next=p.migrateLegacyPreferences({keywords:['React','react'],workingStyles:['remote'],employmentTypes:['FULL_TIME']});assert.deepEqual(next.keywords,['react']);assert.deepEqual(next.workingStyles,['remote']);assert.deepEqual(next.employmentTypes,['FULL_TIME']);});
 test('cache belongs only to selected account',()=>{const a=m.emptyMobileState();a.draft.firstName='Account A';m.cacheMobile('a',a);assert.equal(m.readMobileCache('b'),null);assert.equal(m.readMobileCache('a').draft.firstName,'Account A');});
 test('corrupt fields normalize safely',()=>{const state=m.normalizeMobile({draft:{firstName:null,skills:null,educations:null},done:['GENDER','GENDER','unknown']});assert.equal(state.draft.firstName,'');assert.deepEqual(state.draft.skills,[]);assert.deepEqual(state.done,['GENDER']);});
 test('legacy validated birthday keeps semantic progress',()=>{const old=legacy.createInitialState();old.startedAt='2026-01-01';old.steps.birthday={status:'done',at:'2026-01-01'};old.draft.birth_date='2000-02-29';assert.ok(m.migrateMobile(old).done.includes('BIRTHDAY'));});
 test('legacy invalid data never grants completion',()=>{const old=legacy.createInitialState();old.steps.birthday={status:'done',at:'2026-01-01'};assert.ok(!m.migrateMobile(old).done.includes('BIRTHDAY'));});
 test('malformed preference fields cannot crash recovery',()=>{const next=p.migrateLegacyPreferences({expertise:17,work_styles:{},targetCountries:[null,'GB'],keywords:[false,'React'],employmentTypes:['REMOTE','FULL_TIME']});assert.deepEqual(next.expertise,[]);assert.deepEqual(next.targetCountries,['GB']);assert.deepEqual(next.keywords,['react']);assert.ok(next.workingStyles.includes('remote'));});
 test('null preferences recover to empty',()=>assert.deepEqual(p.migrateLegacyPreferences(null).keywords,[]));
 test('browser quota failure does not throw',()=>{const original=localStorage.setItem;localStorage.setItem=()=>{throw new Error('Quota exceeded');};try{assert.equal(m.cacheMobile('quota',m.emptyMobileState()),false);assert.doesNotThrow(()=>p.savePreferences('quota',p.EMPTY_PREFERENCES));}finally{localStorage.setItem=original;}});
 console.log(`${passed} onboarding contract checks passed.`);
}finally{await server.close();}
