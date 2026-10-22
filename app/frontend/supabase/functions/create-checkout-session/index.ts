import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.0.0';
const APP_ID='91d3436dfc';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Content-Type':'application/json'};
const response=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
const priceKey=(plan:string)=>`APP_${APP_ID}_STRIPE_VIA_${plan==='via_premium_monthly'?'MONTHLY':'YEARLY'}_PRICE_ID`;
Deno.serve(async req=>{
 const requestId=crypto.randomUUID();console.log(JSON.stringify({requestId,method:req.method,bodySize:req.headers.get('content-length'),hasAuthorization:!!req.headers.get('authorization')}));
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return response(405,{error:'POST required'});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 try{
  const secret=Deno.env.get('STRIPE_SECRET_KEY');const site=Deno.env.get(`APP_${APP_ID}_SITE_URL`);
  const stripe=secret?new Stripe(secret,{apiVersion:'2022-11-15',httpClient:Stripe.createFetchHttpClient()}):null;
  const catalog=async()=>{const r=await db.from('billing_plans').select('*').eq('active',true);if(r.error)throw r.error;return r.data;};
  const validatePrice=async(plan:string)=>{
   const row=(await catalog()).find(p=>p.id===plan);const id=Deno.env.get(priceKey(plan));
   if(!row||!['via_premium_monthly','via_premium_yearly'].includes(plan))throw new Error('Invalid plan');
   if(!stripe||!id)throw new Error(`Missing Stripe configuration: ${priceKey(plan)}`);
   const price=await stripe.prices.retrieve(id);
   if(!price.active||price.currency!==row.currency||price.unit_amount!==row.amount||price.recurring?.interval!==row.billing_interval||price.recurring?.interval_count!==1||price.type!=='recurring')throw new Error('Stripe price does not match the VIA Premium catalog. Checkout blocked.');
   return {row,price};
  };
  const sync=async(sub:Stripe.Subscription,uid:string)=>{
   if(sub.metadata.app_id!==APP_ID||sub.metadata.user_id!==uid)throw new Error('Subscription ownership mismatch');
   const plan=sub.metadata.plan;const {row,price}=await validatePrice(plan);
   if(sub.items.data.length!==1||sub.items.data[0].price.id!==price.id||sub.items.data[0].quantity!==1)throw new Error('Subscription price mismatch');
   const latest=sub.latest_invoice?(typeof sub.latest_invoice==='string'?await stripe!.invoices.retrieve(sub.latest_invoice):sub.latest_invoice):null;
   const paid=latest?.status==='paid'&&latest.amount_paid===row.amount&&latest.currency===row.currency;
   const healthy=sub.status==='active'&&paid;
   const state=sub.status==='canceled'?'expired':healthy?(sub.cancel_at_period_end?'cancelled':'active'):['past_due','unpaid'].includes(sub.status)?'payment_failed':'inactive';
   const update={plan,billing_cycle:row.billing_interval==='month'?'monthly':'yearly',status:state,stripe_customer_id:typeof sub.customer==='string'?sub.customer:sub.customer.id,stripe_subscription_id:sub.id,current_period_start:new Date(sub.current_period_start*1000).toISOString(),current_period_end:new Date(sub.current_period_end*1000).toISOString(),cancel_at_period_end:sub.cancel_at_period_end,verified_at:healthy?new Date().toISOString():null,updated_at:new Date().toISOString(),checkout_url:null};
   const result=await db.from('subscriptions').upsert({user_id:uid,...update},{onConflict:'user_id'});if(result.error)throw result.error;return update;
  };
  if(new URL(req.url).searchParams.get('webhook')==='true'){
   const ws=Deno.env.get(`APP_${APP_ID}_STRIPE_WEBHOOK_SECRET`);const sig=req.headers.get('stripe-signature');
   if(!stripe||!ws)return response(503,{error:'Stripe webhook is not configured'});
   if(!sig)return response(400,{error:'Signature required'});
   let event:Stripe.Event;try{event=await stripe.webhooks.constructEventAsync(await req.text(),sig,ws,undefined,Stripe.createSubtleCryptoProvider());}catch{return response(400,{error:'Invalid signature'});}
   let subscriptionId:string|null=null;
   if(event.type.startsWith('customer.subscription.')){const sub=event.data.object as Stripe.Subscription;if(sub.metadata.app_id===APP_ID)subscriptionId=sub.id;}
   if(event.type.startsWith('checkout.session.')){const session=event.data.object as Stripe.Checkout.Session;if(session.metadata?.app_id===APP_ID&&session.metadata.product==='via_premium'&&session.subscription)subscriptionId=typeof session.subscription==='string'?session.subscription:session.subscription.id;}
   if(['invoice.paid','invoice.payment_failed'].includes(event.type)){const invoice=event.data.object as Stripe.Invoice;if(invoice.subscription)subscriptionId=typeof invoice.subscription==='string'?invoice.subscription:invoice.subscription.id;}
   if(subscriptionId){const sub=await stripe.subscriptions.retrieve(subscriptionId);if(sub.metadata.app_id===APP_ID)await sync(sub,sub.metadata.user_id);}
   return response(200,{received:true});
  }
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token)return response(401,{error:'Authentication required'});
  const auth=await db.auth.getUser(token);const user=auth.data.user;if(auth.error||!user)return response(401,{error:'Authentication required'});
  const role=await db.from('user_profiles').select('role').eq('user_id',user.id).single();if(role.data?.role!=='job_seeker')return response(403,{error:'Job Seeker required'});
  let body:{action?:string;plan?:string;billingCycle?:string;returnUrl?:string;sessionId?:string;platform?:string};try{body=await req.json();}catch{return response(400,{error:'Invalid request'});}
  const action=body.action||'checkout';
  if(action==='catalog'){
   const plans=await catalog();let configured=true;let configurationError='';
   try{if(!site||!stripe)throw new Error('Missing STRIPE_SECRET_KEY or APP_91d3436dfc_SITE_URL');for(const p of plans)await validatePrice(p.id);}catch(e){configured=false;configurationError=(e as Error).message;}
   return response(200,{plans,configured,configurationError});
  }
  const current=await db.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle();if(current.error)throw current.error;
  if(action==='state'){
   if(current.data?.stripe_subscription_id&&stripe){const sub=await stripe.subscriptions.retrieve(current.data.stripe_subscription_id);await sync(sub,user.id);}
   const refreshed=await db.from('subscriptions').select('*').eq('user_id',user.id).maybeSingle();if(refreshed.error)throw refreshed.error;
   return response(200,{subscription:refreshed.data});
  }
  if(!stripe||!site)return response(503,{error:'Stripe checkout requires STRIPE_SECRET_KEY and APP_91d3436dfc_SITE_URL. No payment or Premium activation occurred.'});
  const returnUrl=new URL(body.returnUrl||`${site}/seeker/subscription`);
  if(returnUrl.origin!==new URL(site).origin||returnUrl.pathname!=='/seeker/subscription')return response(400,{error:'Invalid return destination'});
  if(action==='verify'){
   if(!body.sessionId)return response(400,{error:'Checkout session required'});
   const session=await stripe.checkout.sessions.retrieve(body.sessionId);
   if(session.metadata?.app_id!==APP_ID||session.metadata.product!=='via_premium'||session.metadata.user_id!==user.id||!session.subscription)return response(403,{error:'Checkout ownership mismatch'});
   const {row,price}=await validatePrice(session.metadata.plan);
   const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:2});
   if(session.payment_status!=='paid'||session.currency!==row.currency||session.amount_total!==row.amount||lines.data.length!==1||lines.data[0].price?.id!==price.id||lines.data[0].quantity!==1)return response(409,{error:'Payment not settled or configured amount mismatch. Premium not activated.'});
   const sub=await stripe.subscriptions.retrieve(typeof session.subscription==='string'?session.subscription:session.subscription.id);
   const state=await sync(sub,user.id);return response(200,{verified:state.status==='active'||state.status==='cancelled',subscription:state});
  }
  if(action==='manage'){
   if(body.platform==='native')return response(409,{error:'Native subscription management requires its approved billing platform.'});
   if(!current.data?.stripe_customer_id)return response(409,{error:'No subscription to manage'});
   const portal=await stripe.billingPortal.sessions.create({customer:current.data.stripe_customer_id,return_url:returnUrl.toString()});return response(200,{url:portal.url});
  }
  if(action==='cancel_pending'){
   if(current.data?.status!=='checkout_pending')return response(200,{cancelled:true});
   if(current.data.checkout_session_id){const s=await stripe.checkout.sessions.retrieve(current.data.checkout_session_id);if(s.status==='complete')return response(409,{error:'Checkout completed. Verify payment before purchasing again.'});if(s.status==='open')await stripe.checkout.sessions.expire(s.id);}
   const r=await db.from('subscriptions').update({status:'inactive',checkout_url:null,checkout_started_at:null,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('checkout_key',current.data.checkout_key);if(r.error)throw r.error;return response(200,{cancelled:true});
  }
  if(action!=='checkout')return response(400,{error:'Unknown action'});
  if(body.platform==='native')return response(409,{error:'Native digital subscriptions require an approved store billing integration. Web checkout is unavailable in the native app.'});
  const plan=body.plan==='premium'||body.plan==='seeker_premium'?(body.billingCycle==='yearly'||body.billingCycle==='annual'?'via_premium_yearly':'via_premium_monthly'):body.plan!;
  const {row,price}=await validatePrice(plan);
  if(current.data?.stripe_subscription_id){const existing=await stripe.subscriptions.retrieve(current.data.stripe_subscription_id);await sync(existing,user.id);if(!['canceled','incomplete_expired'].includes(existing.status))return response(409,{error:'An existing subscription must be managed before purchasing another.'});}
  const reserved=await db.rpc('reserve_via_checkout',{account_user:user.id,plan_id:plan});if(reserved.error)return response(409,{error:reserved.error.message});const record=reserved.data;
  if(record.checkout_url&&record.checkout_session_id){const pending=await stripe.checkout.sessions.retrieve(record.checkout_session_id);if(pending.status==='open')return response(200,{url:pending.url,sessionId:pending.id});return response(409,{error:'Checkout already completed or expired. Verify or cancel the pending checkout first.'});}
  const success=new URL(returnUrl);success.searchParams.set('success','true');success.searchParams.set('via_session','{CHECKOUT_SESSION_ID}');const cancel=new URL(returnUrl);cancel.searchParams.set('via_cancelled','true');
  const metadata={app_id:APP_ID,product:'via_premium',user_id:user.id,plan};
  const session=await stripe.checkout.sessions.create({mode:'subscription',customer_email:user.email,line_items:[{price:price.id,quantity:1}],allow_promotion_codes:false,expires_at:Math.floor(new Date(record.checkout_started_at).getTime()/1000)+86400,success_url:success.toString().replace('%7BCHECKOUT_SESSION_ID%7D','{CHECKOUT_SESSION_ID}'),cancel_url:cancel.toString(),metadata,subscription_data:{metadata},custom_text:{submit:{message:`VIA Premium: ${row.currency.toUpperCase()} ${row.amount/100} per ${row.billing_interval}. Subscription auto renews until cancelled. Manage or cancel through Manage Subscription; cancellation takes effect at the end of the paid term.`}}},{idempotencyKey:`via:${record.checkout_key}`});
  const stored=await db.from('subscriptions').update({checkout_session_id:session.id,checkout_url:session.url,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('checkout_key',record.checkout_key);if(stored.error)throw stored.error;
  return response(200,{url:session.url,sessionId:session.id});
 }catch(e){console.error(JSON.stringify({requestId,error:String(e)}));return response(503,{error:(e as Error).message||'Billing unavailable. No unverified Premium activation occurred.'});}
});
