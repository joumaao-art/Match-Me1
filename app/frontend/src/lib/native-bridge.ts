interface NativeBridge { postMessage: (message: string) => void }
export function nativeBridge(): NativeBridge | undefined {
 return (window as Window & {ReactNativeWebView?:NativeBridge}).ReactNativeWebView;
}
export async function nativeShareJob(job:{id:string;job_title:string;company_name:string}):Promise<boolean> {
 const bridge=nativeBridge();if(!bridge)return false;
 const id=crypto.randomUUID();
 await new Promise<void>((resolve,reject)=>{
  const finish=(status:string)=>{window.clearTimeout(timer);window.removeEventListener('matchme:native-share-result',listener);if(status==='shared')resolve();else reject(Object.assign(new Error(status==='cancelled'?'Share cancelled':'Unable to share job'),{name:status==='cancelled'?'AbortError':'Error'}));};
  const listener=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.id===id)finish(detail.status);};
  const timer=window.setTimeout(()=>finish('error'),60000);
  window.addEventListener('matchme:native-share-result',listener);
  try{bridge.postMessage(JSON.stringify({type:'share-job',id,jobId:job.id,title:job.job_title,company:job.company_name}));}catch{finish('error');}
 });return true;
}
