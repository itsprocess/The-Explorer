export class AppError extends Error{constructor(message:string,public status=400,public code?:string){super(message);}}
export function publicFailure(e:unknown){return e instanceof AppError?{error:e.message,code:e.code,status:e.code==='generation_pending'?202:e.status}:{error:'This location could not finish loading. Please retry.',code:'generation_failed',status:502};}
