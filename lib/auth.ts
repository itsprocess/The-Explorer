import {publicFailure} from './app-error';
import {getChatGPTUser} from '../app/chatgpt-auth';
import {AppError,bindings} from './server';
import {isAdminEmail} from './admin-policy';
export async function requireOwner(){const user=await getChatGPTUser();if(!user)throw new AppError('Sign in with ChatGPT to view generation data.',401);if(!isAdminEmail(user.email,bindings().ADMIN_EMAIL))throw new AppError('This control is restricted to the site owner.',403);return user.userId;}
export function checkOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new AppError('This action must come from the Explorer page.',403);}
export function errorResponse(error:unknown){
 const failure=publicFailure(error);return Response.json(failure,{status:failure.status,headers:{'Cache-Control':'no-store',...(failure.code==='generation_pending'?{'Retry-After':'5'}:{})}});
}

export async function canInspect(){const user=await getChatGPTUser();return isAdminEmail(user?.email,bindings().ADMIN_EMAIL);}
