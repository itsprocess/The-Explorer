import {savedImage} from '../../../../../lib/location-images';
import {bindings} from '../../../../../lib/server';
import {checkCoordinate} from '../../../../../lib/world';
export async function GET(request:Request,{params}:{params:Promise<{x:string;y:string}>}){
 const raw=await params,x=Number(raw.x),y=Number(raw.y);
 try{checkCoordinate(x,y);}catch{return new Response('Not found',{status:404});}
 const image=await savedImage(x,y);if(!image)return new Response('Not generated',{status:404});
 const object=await bindings().IMAGES.get(image.objectKey);if(!object)return new Response('Not found',{status:404});
 return new Response(object.body,{headers:{'Content-Type':'image/webp','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
}
