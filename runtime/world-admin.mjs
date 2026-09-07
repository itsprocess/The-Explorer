// Runs after the trusted password gate. No account deletion endpoint exists.
export function worldAdmin(storage,bindings,configuredSeed,basePath){
 let active=0;
 return (req,res,next)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path===basePath+'/api/world-admin'){
   const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
   if(req.headers['oai-authenticated-user-id']!=='portable-owner')return send(403,{error:'Administrator access required.'});
   if(req.method==='GET')return send(200,{available:true,seedVariable:'WORLD_SEED',seedChangePending:bindings.WORLD_SEED!==configuredSeed});
   if(req.method!=='POST')return send(405,{error:'Method not allowed.'});
   if(req.headers['x-explorer-confirm']!=='WIPE WORLD')return send(400,{error:'World reset confirmation required.'});
   if(active)return send(409,{error:'Other requests are active. Wait for exploration to finish, then try again.'});
   try{
    const result=storage.resetWorld(configuredSeed);
    bindings.WORLD_SEED=result.seed;bindings.WORLD_EPOCH=result.epoch;
    return send(200,{reset:true,accountsPreserved:true,cleanupWarning:result.cleanupWarning});
   }catch(e){return send(409,{error:e.message});}
  }
  active++;let released=false;
  const release=()=>{if(!released){released=true;active--;}};
  res.once('finish',release);res.once('close',release);
  next();
 };
}
