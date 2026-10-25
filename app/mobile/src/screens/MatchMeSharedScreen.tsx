import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Linking, Share, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { linkedJobId } from '../lib/job-links';

const pendingKey='matchme:native-shared-job';
export function MatchMeSharedScreen({origin}:{origin:string}) {
 const inset=useSafeAreaInsets();const web=useRef<WebView>(null);const canBack=useRef(false);const incoming=useRef(false);const [uri,setUri]=useState(`${origin}/seeker?view=swipe`);const [failed,setFailed]=useState(false);const [ready,setReady]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let alive=true;
  const receive=(url:string)=>{const id=linkedJobId(url,origin);if(!id)return;incoming.current=true;void AsyncStorage.setItem(pendingKey,id).catch(()=>undefined);if(alive){setUri(`${origin}/jobs/${id}`);setFailed(false);}};
  const subscription=Linking.addEventListener('url',event=>receive(event.url));
  void (async()=>{try{const initial=await Linking.getInitialURL();if(initial)receive(initial);if(!incoming.current){const pending=await AsyncStorage.getItem(pendingKey);if(pending&&linkedJobId(`${origin}/jobs/${pending}`,origin)&&alive)setUri(`${origin}/jobs/${pending}`);}}finally{if(alive)setReady(true);}})();
  const back=BackHandler.addEventListener('hardwareBackPress',()=>{if(canBack.current){web.current?.goBack();return true;}return false;});
  return()=>{alive=false;subscription.remove();back.remove();};
 },[origin]);
 const external=(url:string)=>{try{const u=new URL(url);if(['https:','mailto:','tel:'].includes(u.protocol))void Linking.openURL(url).catch(()=>Alert.alert('MatchMe','Unable to open this link. / تعذر فتح الرابط.'));}catch{/* Reject invalid and executable URLs. */}};
 const respond=(id:string,status:string)=>web.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('matchme:native-share-result',{detail:${JSON.stringify({id,status})}}));true;`);
 if(!ready)return <ActivityIndicator accessibilityLabel="Loading MatchMe" style={{flex:1}}/>;
 return <View style={{flex:1,paddingTop:inset.top,paddingBottom:inset.bottom,paddingLeft:inset.left,paddingRight:inset.right,backgroundColor:'#ffffff'}}>
  <WebView ref={web} source={{uri}} style={{flex:1}} domStorageEnabled javaScriptEnabled mixedContentMode="never" allowFileAccess={false} originWhitelist={[origin]} setSupportMultipleWindows
   onShouldStartLoadWithRequest={request=>{try{if(new URL(request.url).origin===origin)return true;}catch{return false;}external(request.url);return false;}}
   onOpenWindow={event=>external(event.nativeEvent.targetUrl)}
   onLoadStart={()=>setLoading(true)} onLoadEnd={()=>setLoading(false)} onError={()=>setFailed(true)} onRenderProcessGone={()=>setFailed(true)}
   onNavigationStateChange={state=>{canBack.current=state.canGoBack;}}
   onMessage={event=>{try{if(new URL(event.nativeEvent.url).origin!==origin)return;const message=JSON.parse(event.nativeEvent.data);if(message.type==='job-opened'&&typeof message.jobId==='string'&&linkedJobId(`${origin}/jobs/${message.jobId}`,origin)){void AsyncStorage.removeItem(pendingKey);return;}if(message.type!=='share-job'||typeof message.id!=='string'||message.id.length>100||typeof message.jobId!=='string'||!linkedJobId(`${origin}/jobs/${message.jobId}`,origin))return;void Share.share({title:String(message.title||'MatchMe').slice(0,300),message:`${String(message.title||'').slice(0,300)} — ${String(message.company||'').slice(0,300)}\n${origin}/jobs/${message.jobId}`}).then(result=>respond(message.id,result.action===Share.sharedAction?'shared':'cancelled')).catch(()=>respond(message.id,'error'));}catch{/* Ignore malformed/untrusted bridge messages. */}}/>
  {loading&&!failed&&<ActivityIndicator style={{position:'absolute',top:inset.top+12,alignSelf:'center'}} accessibilityLabel="Loading MatchMe"/>}
  {failed&&<View style={{position:'absolute',inset:0,justifyContent:'center',alignItems:'center',padding:24,backgroundColor:'#ffffff'}}><Text style={{color:'#0f172a',textAlign:'center'}}>Unable to load MatchMe. Check your connection.{'\n'}تعذر تحميل MatchMe. تحقق من اتصالك.</Text><TouchableOpacity accessibilityRole="button" style={{padding:16,marginTop:12,backgroundColor:'#2563eb',borderRadius:8}} onPress={()=>{setFailed(false);web.current?.reload();}}><Text style={{color:'#ffffff'}}>Retry / إعادة المحاولة</Text></TouchableOpacity></View>}
 </View>;
}
