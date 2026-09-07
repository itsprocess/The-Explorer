export function isAdminEmail(email:string|undefined,configured:string|undefined){return !!email&&!!configured&&email.trim().toLowerCase()===configured.trim().toLowerCase();}
