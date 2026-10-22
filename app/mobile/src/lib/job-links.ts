export function configuredOrigin(value: string | undefined): string | null {
 try {const url=new URL(value||'');return url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash?url.origin:null;}catch{return null;}
}
export function linkedJobId(value: string, origin: string): string | null {
 try {const url=new URL(value);if(url.origin!==origin)return null;const match=url.pathname.match(/^\/jobs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);return match?.[1]||null;}catch{return null;}
}
