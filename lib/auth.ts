import {getChatGPTUser} from '../app/chatgpt-auth';
import {AppError} from './server';
export async function requireOwner(){const user=await getChatGPTUser();if(!user)throw new AppError('Sign in with ChatGPT to view generation data.',401);return user.userId;}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new AppError('This action must come from the Explorer page.',403);}
export function errorResponse(error:unknown){const pending=error instanceof AppError&&error.code==='generation_pending';const status=pending?202:error instanceof AppError?error.status:500;return Response.json({error:error instanceof AppError?error.message:'The world could not finish this request. Saved places are safe; please retry.',code:error instanceof AppError?error.code:undefined},{status,headers:{'Cache-Control':'no-store',...(pending?{'Retry-After':'5'}:{})}});}
