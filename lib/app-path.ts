// Build-time mount path; Sites stays at root, portable Node uses hosting.basePath.
export const basePath=process.env.NEXT_PUBLIC_EXPLORER_BASE_PATH||'';
export function appPath(path:string){return !basePath||path===basePath||path.startsWith(basePath+'/')?path:basePath+path;}
