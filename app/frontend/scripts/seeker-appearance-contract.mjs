import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
let count=0;const test=(name,fn)=>{fn();count++;console.log(`PASS ${name}`);};
const baseline=JSON.parse(await readFile('scripts/artifacts/seeker-theme-baseline.json','utf8'));
for(const [path,hash] of Object.entries(baseline)){let bytes=await readFile(path);if(path==='src/stores/app.store.ts')bytes=Buffer.from(bytes.toString().replace('export function applyTheme','function applyTheme'));if(path==='src/components/shared/MobileBottomNav.tsx')bytes=Buffer.from(bytes.toString().replace("import { useIsMobile } from '@/hooks/use-mobile';\n",'').replace('  const mobile = useIsMobile();\n','').replace('  if (!mobile) return null;\n','').replace('z-40 bg-background','z-40 md:hidden bg-background').replace('grid grid-cols-3 h-16 max-w-2xl mx-auto','grid grid-cols-3 h-16'));test(`preserved ${path}`,()=>assert.equal(createHash('sha256').update(bytes).digest('hex'),hash));}
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};globalThis.sessionStorage=globalThis.localStorage;
let dark=false,systemDark=false;const events=new Map();const preference={get matches(){return systemDark;},addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key)};
globalThis.document={hidden:false,documentElement:{classList:{contains:()=>dark,add:()=>dark=true,remove:()=>dark=false},style:{colorScheme:''}},addEventListener:()=>{},removeEventListener:()=>{}};
globalThis.window={atob:globalThis.atob,btoa:globalThis.btoa,console,location:{origin:'https://example.com'},matchMedia:()=>preference,addEventListener:()=>{},removeEventListener:()=>{}};
globalThis.WebSocket=class{static OPEN=1;static CONNECTING=0;static CLOSED=3;};
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const appearance=await server.ssrLoadModule('/src/lib/seeker-appearance.ts');const {useAuthStore,useAppStore}=await server.ssrLoadModule('/src/stores/index.ts');const {apiClient}=await server.ssrLoadModule('/src/services/api-client.ts');
 let uid='owner',settings={},fail=false,writes=0;
 apiClient.auth.getUser=async()=>({data:{user:{id:uid}},error:null});
 apiClient.supabase.from=()=>{const builder={select:()=>builder,eq:()=>builder,abortSignal:()=>builder,single:async()=>({data:{account_settings:{...settings}},error:null})};return builder;};
 apiClient.supabase.rpc=(_name,payload)=>({abortSignal:async()=>{writes++;if(fail)return{data:null,error:new Error('conflict')};settings={...settings,...payload.p_patch};return{data:{account_settings:{...settings}},error:null};}});
 const login=id=>{uid=id;useAuthStore.setState({userId:id,userRole:'job_seeker',isAuthenticated:true,isLoading:false});};login('owner');storage.delete(useAppStore.persist.getOptions().name);
 test('only three valid preferences accepted',()=>{for(const value of ['light','dark','system'])assert.equal(appearance.isSeekerTheme(value),true);for(const value of ['auto',null,{},''])assert.equal(appearance.isSeekerTheme(value),false);});
 test('system resolves operating-system appearance',()=>{assert.equal(appearance.resolvedSeekerTheme('system',true),'dark');assert.equal(appearance.resolvedSeekerTheme('system',false),'light');});
 await appearance.refreshSeekerTheme('owner');test('new account without saved choice defaults to system',()=>assert.equal(appearance.useSeekerAppearance.getState().theme,'system'));
 settings={theme:'dark',language:'ar',notifications:{enabled:true}};await appearance.refreshSeekerTheme('owner');test('server choice is authoritative and cached per owner',()=>{assert.equal(dark,true);assert.equal(appearance.readThemeCache('owner'),'dark');assert.equal(appearance.readThemeCache('other'),null);});
 await appearance.saveSeekerTheme('owner','light');test('Light applies and persisted acknowledgement marks saved',()=>{assert.equal(dark,false);assert.equal(settings.theme,'light');assert.equal(settings.language,'ar');assert.equal(settings.notifications.enabled,true);assert.equal(appearance.useSeekerAppearance.getState().saved,true);});
 await appearance.saveSeekerTheme('owner','dark');test('Dark applies through existing class tokens',()=>assert.equal(dark,true));
 await appearance.saveSeekerTheme('owner','system');const stop=appearance.startSeekerThemeSync('owner');await new Promise(r=>setTimeout(r,0));systemDark=true;events.get('change')();test('System follows operating-system changes immediately',()=>assert.equal(dark,true));systemDark=false;events.get('change')();test('System follows return to light',()=>assert.equal(dark,false));stop();
 settings={theme:'light'};await appearance.refreshSeekerTheme('owner');fail=true;await appearance.saveSeekerTheme('owner','dark');test('failed save reconciles server and never reports saved',()=>{assert.equal(appearance.useSeekerAppearance.getState().error,true);assert.equal(appearance.useSeekerAppearance.getState().saved,false);assert.equal(appearance.readThemeCache('owner'),'light');assert.equal(dark,false);});fail=false;
 appearance.releaseSeekerTheme();login('other');settings={};await appearance.refreshSeekerTheme('other');test('switching owner never inherits another owner cache',()=>assert.equal(appearance.useSeekerAppearance.getState().theme,'system'));
 useAuthStore.setState({userRole:'company'});const previous=writes;await appearance.saveSeekerTheme('other','dark');test('Company cannot save seeker appearance',()=>assert.equal(writes,previous));appearance.releaseSeekerTheme();
 login('legacy');storage.set(useAppStore.persist.getOptions().name,JSON.stringify({state:{theme:'dark'}}));settings={language:'en'};await appearance.refreshSeekerTheme('legacy');test('explicit legacy choice migrates only if server theme missing',()=>assert.equal(settings.theme,'dark'));settings={theme:'light'};await appearance.refreshSeekerTheme('legacy');test('legacy never overrides explicit server choice',()=>assert.equal(appearance.useSeekerAppearance.getState().theme,'light'));appearance.releaseSeekerTheme();
 const nav=await readFile('src/components/seeker/DesktopSeekerNavigation.tsx','utf8');test('sidebar theme icon removed but language preserved',()=>{assert.ok(!/Moon|Sun|toggle.*dark|setDark/.test(nav));assert.ok(nav.includes('changeLanguage('));assert.deepEqual([...nav.matchAll(/\{ id:'([^']+)', Icon:/g)].map(m=>m[1]),['swipe','dashboard','profile','subscription_overview','preferences']);});
 for(const platform of ['Mobile','Desktop']){const source=await readFile(`src/components/seeker/${platform}Support.tsx`,'utf8');test(`${platform} Appearance mounted inside existing Settings`,()=>assert.ok(source.includes("{copy('Settings','الإعدادات')}</h1><SeekerAppearance uid={account.uid}/>")));}
 const ui=await readFile('src/components/seeker/SeekerAppearance.tsx','utf8');test('localized accessible three-option settings control',()=>{assert.ok(ui.includes('role="radiogroup"'));assert.ok(ui.includes('role="radio"'));for(const label of ['Light Mode','Dark Mode','System Default','المظهر'])assert.ok(ui.includes(label));});
 const boot=await readFile('src/main.tsx','utf8');test('cached appearance applies before runtime configuration and render',()=>assert.ok(boot.indexOf('bootstrapSeekerTheme();')<boot.indexOf('await loadRuntimeConfig()')));
 console.log(`${count} appearance source/unit checks passed; no live account or cross-device acceptance claimed.`);
}finally{await server.close();}
process.exit(0);
