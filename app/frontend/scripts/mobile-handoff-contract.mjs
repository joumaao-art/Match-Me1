import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { Window } from 'happy-dom';
import ts from 'typescript';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) };
globalThis.window = { location: { origin: 'https://example.com' } };
globalThis.WebSocket = class { static OPEN=1; static CONNECTING=0; static CLOSED=3; };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let count=0;
async function test(name, run) { await run(); count++; console.log(`PASS ${name}`); }
try {
 const { validateCvFile, CV_MAX_BYTES } = await server.ssrLoadModule('/src/lib/cv-file-validation.ts');
 for (const [name,type] of [['resume.pdf','application/pdf'],['resume.doc','application/msword'],['resume.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],['resume.txt','text/plain'],['سيرة.PDF',''],['resume.pdf','application/octet-stream']]) {
  await test(`valid chooser metadata ${name} ${type}`, () => validateCvFile({name,type,size:100}));
 }
 for (const file of [{name:'x.pdf',type:'',size:0},{name:'x.pdf',type:'',size:CV_MAX_BYTES+1},{name:'x.exe',type:'',size:100},{name:'x.pdf',type:'text/html',size:100},{name:'x.pdf',type:'',size:NaN}]) {
  await test(`reject invalid metadata ${JSON.stringify(file)}`, () => assert.throws(() => validateCvFile(file)));
 }
 await test('exact maximum accepted', () => validateCvFile({name:'x.pdf',type:'application/pdf',size:CV_MAX_BYTES}));
 const {apiClient}=await server.ssrLoadModule('/src/services/api-client.ts');
 const {profileService}=await server.ssrLoadModule('/src/services/profile.service.ts');
 let owner='owner', uploads=0, attaches=0, changeDuringUpload=false, uploadError=false;
 apiClient.auth.getUser=async()=>({data:{user:{id:owner}},error:null});
 apiClient.storage.from=()=>({upload:async()=>{uploads++;if(changeDuringUpload)owner='other';return{data:{},error:uploadError?{message:'Upload failed'}:null};}});
 apiClient.supabase.rpc=()=>{attaches++;return{abortSignal:async()=>({data:{},error:null})};};
 const file={name:'resume.pdf',size:100,type:'application/pdf'};
 await test('valid upload attaches exactly once',async()=>{const r=await profileService.uploadCV('owner',file);assert.equal(r.error,null);assert.equal(attaches,1);});
 await test('wrong owner never uploads',async()=>{owner='other';const before=uploads;const r=await profileService.uploadCV('owner',file);assert.ok(r.error);assert.equal(uploads,before);});
 await test('invalid file never uploads',async()=>{owner='owner';const before=uploads;const r=await profileService.uploadCV('owner',{...file,size:0});assert.ok(r.error);assert.equal(uploads,before);});
 await test('account switch during upload never attaches',async()=>{owner='owner';changeDuringUpload=true;const before=attaches;const r=await profileService.uploadCV('owner',file);assert.ok(r.error);assert.equal(attaches,before);changeDuringUpload=false;});
 await test('upload failure never replaces CV metadata',async()=>{owner='owner';uploadError=true;const before=attaches;const r=await profileService.uploadCV('owner',file);assert.ok(r.error);assert.equal(attaches,before);uploadError=false;});
 const account=await server.ssrLoadModule('/src/services/mobile-account.ts');
 let switchDuringLink=false;
 apiClient.storage.from=()=>({createSignedUrl:async()=>{if(switchDuringLink)owner='other';return{data:{signedUrl:'https://example.com/private'},error:null};}});
 await test('CV path rejects foreign owner and traversal',()=>{assert.equal(account.cvOwnerPath('other/x.pdf','owner'),null);assert.equal(account.cvOwnerPath('owner/../x.pdf','owner'),null);});
 await test('signed link uses current owner',async()=>{owner='owner';assert.equal(await account.cvLink('owner','owner/x.pdf'),'https://example.com/private');});
 await test('changed account cannot receive signed link',async()=>{owner='owner';switchDuringLink=true;await assert.rejects(()=>account.cvLink('owner','owner/x.pdf'));});
 // Execute the injected browser JavaScript in an isolated DOM, not a native project.
 const source=await readFile('../mobile/src/lib/appearance-bridge.ts','utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};new Function('exports',compiled)(exports);
 const dom=new Window();const messages=[];dom.ReactNativeWebView={postMessage:value=>messages.push(JSON.parse(value))};
 dom.eval(exports.appearanceObserverScript);
 await test('appearance initially reports light',()=>assert.deepEqual(messages.at(-1),{type:'appearance',theme:'light'}));
 dom.document.documentElement.classList.add('dark');await dom.happyDOM.waitUntilComplete();
 await test('appearance follows dark class',()=>assert.equal(messages.at(-1).theme,'dark'));
 dom.document.documentElement.classList.remove('dark');await dom.happyDOM.waitUntilComplete();
 await test('appearance follows return to light',()=>assert.equal(messages.at(-1).theme,'light'));
 await test('observer installs only once',()=>{const before=messages.length;dom.eval(exports.appearanceObserverScript);assert.equal(messages.length,before);});
 await test('bridge payload has no account or token data',()=>assert.ok(messages.every(m=>Object.keys(m).sort().join(',')==='theme,type')));
 const shell=await readFile('../mobile/src/screens/MatchMeSharedScreen.tsx','utf8');
 await test('native theme receiver validates origin before appearance',()=>assert.ok(shell.indexOf('new URL(event.nativeEvent.url).origin!==origin')<shell.indexOf("message.type==='appearance'")));
 await test('native status bar is contrast-aware',()=>assert.ok(shell.includes("<StatusBar style={dark?'light':'dark'}/>")));
 await dom.happyDOM.close();
 console.log(`${count} file/account/DOM bridge checks passed. Backend responses are test doubles; no native execution or live uploads.`);
} finally { await server.close(); }
