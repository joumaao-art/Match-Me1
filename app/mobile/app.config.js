const base = require('./app.json').expo;
module.exports = () => {
 const originValue=process.env.EXPO_PUBLIC_MATCHME_WEB_ORIGIN;
 const packageName=process.env.MATCHME_ANDROID_PACKAGE;
 let origin;
 if(originValue){const url=new URL(originValue);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('MATCHME web origin must be a plain HTTPS origin.');origin=url;}
 if(packageName&&!/^[a-z][a-zA-Z0-9_]*(\.[a-z][a-zA-Z0-9_]*)+$/.test(packageName))throw new Error('Invalid Android package identifier.');
 if(origin&&!packageName)throw new Error('Configure the real MATCHME_ANDROID_PACKAGE before building shared mobile screens.');
 return {...base,name:'MatchMe',platforms:['android'],android:{...base.android,...(packageName?{package:packageName}:{}),...(origin?{intentFilters:[{action:'VIEW',autoVerify:true,category:['BROWSABLE','DEFAULT'],data:[{scheme:'https',host:origin.hostname,pathPrefix:'/jobs/'}]}]}:{})}};
};
