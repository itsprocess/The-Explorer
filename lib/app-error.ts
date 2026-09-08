export class AppError extends Error{constructor(message:string,public status=400,public code?:string){super(message);}}
export function publicFailure(e:unknown){
 if(e instanceof AppError)return {error:e.message,code:e.code,status:e.code==='generation_pending'?202:e.status};
 console.error('Explorer unexpected request failure:',e instanceof Error?e.stack:String(e));
 return {error:'This location could not finish loading. Please retry.',code:'generation_failed',status:502};
}
