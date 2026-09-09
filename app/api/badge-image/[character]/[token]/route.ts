import {badgeDetail} from '../../../../../lib/badge-detail';
import {bindings,namespace} from '../../../../../lib/server';
export async function GET(_request:Request,{params}:{params:Promise<{character:string;token:string}>}){
 const {character,token}=await params,d=await badgeDetail(character,token);if(!d||d.x===undefined||d.y===undefined)return new Response('Not found',{status:404});
 const object=await bindings().IMAGES.get(namespace()+'illustrations/'+d.x+'/'+d.y+'.webp');if(!object)return new Response('Image not available',{status:404});
 return new Response(object.body,{headers:{'Content-Type':'image/webp','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
}
