import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const name=process.env.MATCHME_ANDROID_PACKAGE;
const fingerprints=(process.env.MATCHME_ANDROID_SHA256||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
if(!name||!/^[a-z][a-zA-Z0-9_]*(\.[a-z][a-zA-Z0-9_]*)+$/.test(name)||!fingerprints.length||fingerprints.some(x=>!/^([A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(x)))throw new Error('Actual Android package and SHA-256 signing certificate fingerprints are required; no placeholder association is generated.');
const directory=resolve('public/.well-known');await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,'assetlinks.json'),JSON.stringify([{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:name,sha256_cert_fingerprints:fingerprints}}],null,2)+'\n',{flag:'wx'});
console.log('Android association generated. Deploy on the verified web origin with application/json and no redirect.');
