/** Resolve the literal token and common Markdown-escaped forms without replacement-string expansion. */
export function fillCharacter(text:string,name:string){return text.replace(/\\?\{\s*character(?:\\?_|\s+)name\s*\\?\}/gi,()=>name);}
