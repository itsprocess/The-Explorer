import {queue as configQueue} from '../explorer.config.json';
import {db,AppError} from './server';
export const creditMessage='Generation is paused because the OpenAI account is out of API credit. Add credit, then retry generation.';
export async function providerPause(){const r=await db().prepare("SELECT value FROM server_settings WHERE key='provider_pause'").first<{value:string}>();return r?JSON.parse(r.value):null;}
export async function assertProviderReady(){const pause=await providerPause();if(pause&&(!pause.until||pause.until>Date.now()))throw new AppError(pause.message,503,pause.code);}
export async function pauseForCredit(){await db().prepare("INSERT INTO server_settings(key,value) VALUES('provider_pause',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({code:'provider_credit',message:creditMessage,until:null})).run();return new AppError(creditMessage,503,'provider_credit');}
export async function pauseForRateLimit(){await db().prepare("INSERT INTO server_settings(key,value) VALUES('provider_pause',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE json_extract(server_settings.value,'$.code')!='provider_credit'").bind(JSON.stringify({code:'provider_rate_limit',message:'Generation is rate limited. Retry in a minute.',until:Date.now()+configQueue.rateLimitPauseMs})).run();}
export async function resumeProvider(){
 const now=Date.now();const r=await db().prepare("INSERT INTO server_settings(key,value) VALUES('provider_retry',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(server_settings.value AS INTEGER)<?").bind(String(now),now-15000).run();
 if(!r.meta.changes)throw new AppError('Please wait a few seconds before retrying generation.',429);
 await db().batch([db().prepare("DELETE FROM server_settings WHERE key='provider_pause'"),db().prepare("UPDATE generation_jobs SET available=0 WHERE status='failed'")]);
}
