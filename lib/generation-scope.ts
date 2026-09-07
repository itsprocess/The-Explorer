import {AsyncLocalStorage} from 'node:async_hooks';
const context=new AsyncLocalStorage<{priority:number;scope:string}>();
export const generationScope=()=>context.getStore()??{priority:10,scope:''};
export const withGenerationScope=<T>(scope:string,make:()=>Promise<T>,priority=generationScope().priority)=>context.run({scope,priority},make);
