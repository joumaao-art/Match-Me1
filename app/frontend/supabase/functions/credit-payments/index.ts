import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.0.0';

const APP_ID = '91d3436dfc';
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Content-Type':'application/json'};
const respond = (status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async req=>{
 const requestId=crypto.randomUUID();
 console.log(JSON.stringify({requestId,method:req.method,bodySize:req.headers.get('content-length')}));
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try {
  const secret=Deno.env.get('STRIPE_SECRET_KEY');
  const priceId=Deno.env.get(`APP_${APP_ID}_STRIPE_SWIPE_PRICE_ID`);
  const site=Deno.env.get(`APP_${APP_ID}_SITE_URL`);
  if(!secret||!priceId||!site)return respond(503,{error:'Credit purchases are not configured.'});
  const stripe=new Stripe(secret,{apiVersion:'2022-11-15',httpClient:Stripe.createFetchHttpClient()});
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const price=await stripe.prices.retrieve(priceId);
  const quantity=Number(price.metadata.swiping_credits);
  if(!price.active||price.recurring||!Number.isSafeInteger(quantity)||quantity<1||quantity>100000||price.unit_amount===null)return respond(503,{error:'Invalid configured credit pack.'});
  const fulfill=async(session:Stripe.Checkout.Session)=>{
   if(session.metadata?.app_id!==APP_ID||session.metadata?.product!=='swiping_credits')throw new Error('Payment does not belong to this application');
   if(session.payment_status!=='paid')throw new Error('Payment has not settled');
   const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:2});
   if(lines.data.length!==1||lines.data[0].price?.id!==priceId||lines.data[0].quantity!==1||session.currency!==price.currency||session.amount_total!==price.unit_amount)throw new Error('Payment product mismatch');
   const uid=session.metadata.user_id;
   const {data:profile,error:profileError}=await db.from('user_profiles').select('role').eq('user_id',uid).single();
   if(profileError||profile?.role!=='job_seeker')throw new Error('Invalid purchaser');
   const {data,error}=await db.rpc('credit_seeker_purchase',{account_user:uid,payment_reference:session.id,quantity});
   if(error)throw error;
   return data;
  };
  if(new URL(req.url).searchParams.get('webhook')==='true'){
   const webhookSecret=Deno.env.get(`APP_${APP_ID}_STRIPE_WEBHOOK_SECRET`);
   const signature=req.headers.get('stripe-signature');
   if(!webhookSecret||!signature)return respond(400,{error:'Webhook signature required'});
   let event:Stripe.Event;
   try{event=await stripe.webhooks.constructEventAsync(await req.text(),signature,webhookSecret,undefined,Stripe.createSubtleCryptoProvider());}catch{return respond(400,{error:'Invalid signature'});}
   if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
    const session=event.data.object as Stripe.Checkout.Session;
    if(session.metadata?.app_id!==APP_ID)return respond(200,{received:true});
    if(session.payment_status==='paid')await fulfill(session);
   }
   return respond(200,{received:true});
  }
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
  if(!token)return respond(401,{error:'Authentication required'});
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return respond(401,{error:'Authentication required'});
  const {data:profile}=await db.from('user_profiles').select('role').eq('user_id',user.id).single();
  if(profile?.role!=='job_seeker')return respond(403,{error:'Job Seeker account required'});
  let body:{action?:string;returnUrl?:string;sessionId?:string};
  try{body=await req.json();}catch{return respond(400,{error:'Invalid request body'});}
  if(body.action==='catalog')return respond(200,{quantity,amount:price.unit_amount,currency:price.currency});
  if(body.action==='verify'){
   if(!body.sessionId)return respond(400,{error:'Payment session required'});
   const session=await stripe.checkout.sessions.retrieve(body.sessionId);
   if(session.metadata?.user_id!==user.id)return respond(403,{error:'Payment ownership mismatch'});
   return respond(200,{balance:await fulfill(session)});
  }
  if(body.action!=='checkout')return respond(400,{error:'Unknown action'});
  const returnUrl=new URL(body.returnUrl||site);
  if(returnUrl.origin!==new URL(site).origin)return respond(400,{error:'Invalid return origin'});
  returnUrl.searchParams.delete('credit_session');returnUrl.searchParams.delete('credits_cancelled');
  const success=new URL(returnUrl);success.searchParams.set('credit_session','{CHECKOUT_SESSION_ID}');
  const cancel=new URL(returnUrl);cancel.searchParams.set('credits_cancelled','true');
  const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:user.email,line_items:[{price:priceId,quantity:1}],success_url:success.toString().replace('%7BCHECKOUT_SESSION_ID%7D','{CHECKOUT_SESSION_ID}'),cancel_url:cancel.toString(),metadata:{app_id:APP_ID,product:'swiping_credits',user_id:user.id}});
  return respond(200,{url:session.url});
 }catch(error){console.error(JSON.stringify({requestId,error:String(error)}));return respond(500,{error:'Payment request failed. No unverified credits were granted.'});}
});
