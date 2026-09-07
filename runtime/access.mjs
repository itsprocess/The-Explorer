import {createHash,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest();
export function accessGuard(config, env=process.env) {
  const host=config.hosting;
  const originVariable=host.publicOriginEnv||'EXPLORER_PUBLIC_ORIGIN';
  const originValue=env[originVariable]||host.publicOrigin;
  if(!originValue)throw Error('Set '+originVariable+' to this deployment\'s HTTPS origin (no path).');
  const origin=new URL(originValue);
  if(origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)
    throw Error(originVariable+' must be an origin only, such as https://your-generated-domain.example (no path or credentials).');
  if(!/^(?:\/[a-zA-Z0-9_-]+)*$/.test(host.basePath||''))throw Error('basePath must be empty or a slash-prefixed folder path.');
  const friend=env[host.accessPasswordEnv], admin=env[host.adminPasswordEnv];
  if(!friend || friend.length<24 || !admin || admin.length<24 || friend===admin)
    throw Error('Set different access and admin passwords of at least 24 characters. See docs/PORTABLE-HOSTING.md.');
  if(origin.protocol!=='https:' && !['localhost','127.0.0.1','[::1]'].includes(origin.hostname))
    throw Error('A public prototype requires an HTTPS publicOrigin.');
  const friendHash=digest(friend), adminHash=digest(admin);
  return (req,res,next)=>{
    if(host.noIndex)res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    // These headers are authoritative only at the Sites edge. Never trust client copies.
    for(const key of Object.keys(req.headers))if(key.startsWith('oai-')||key.startsWith('x-forwarded-')||key==='forwarded'||key==='cf-connecting-ip')delete req.headers[key];
    req.headers.host=origin.host;
    req.headers['x-forwarded-proto']=origin.protocol.slice(0,-1);
    req.headers['cf-connecting-ip']=req.socket.remoteAddress||'local';
    if(req.url==='/robots.txt') {res.setHeader('Content-Type','text/plain');res.end('User-agent: *\nDisallow: /\n');return;}
    const authorization=req.headers.authorization||'';
    let username='',password='';
    if(authorization.startsWith('Basic ')&&authorization.length<2048){
      const decoded=Buffer.from(authorization.slice(6),'base64').toString('utf8'), colon=decoded.indexOf(':');
      if(colon>=0){username=decoded.slice(0,colon);password=decoded.slice(colon+1);}
    }
    const hash=digest(password), isAdmin=username==='admin'&&timingSafeEqual(hash,adminHash);
    const isFriend=username==='friend'&&timingSafeEqual(hash,friendHash);
    delete req.headers.authorization;
    if(!isAdmin&&!isFriend){res.statusCode=401;res.setHeader('WWW-Authenticate','Basic realm="The Explorer", charset="UTF-8"');res.end('Private prototype');return;}
    if(isAdmin){req.headers['oai-authenticated-user-id']='portable-owner';req.headers['oai-authenticated-user-email']=host.adminEmail;}
    if(req.headers.origin && req.headers.origin!==origin.origin && !['GET','HEAD','OPTIONS'].includes(req.method||'')){
      res.statusCode=403;res.end('Request origin rejected');return;
    }
    if(Number(req.headers['content-length']||0)>host.requestBodyBytes){res.statusCode=413;res.end('Request too large');return;}
    // Reject request paths targeting runtime/config/data, even if a future static directory changes.
    let pathname;try{const url=new URL(req.url,origin);pathname=decodeURIComponent(url.pathname);req.url=url.pathname+url.search;}catch{res.statusCode=400;res.end();return;}
    if(/(?:^|\/)(?:\.|runtime|world-data|node_modules|explorer\.config)/i.test(pathname)){
      res.statusCode=404;res.end('Not found');return;
    }
    // Also bound chunked bodies, which have no Content-Length.
    let received=0;
    req.on?.('data',chunk=>{received+=chunk.length;if(received>host.requestBodyBytes)req.destroy();});
    next();
  };
}
