// A single conditional UPDATE arbitrates capacity across Worker isolates.
export const claimJobSQL=`UPDATE generation_jobs SET status='running',token=?,lease=?,touched=?,attempts=attempts+1
 WHERE id=? AND status!='complete' AND lease<? AND available<=?
 AND (SELECT COUNT(*) FROM generation_jobs WHERE lane=? AND status='running' AND lease>?)<?
 AND NOT EXISTS(SELECT 1 FROM generation_jobs other WHERE other.lane=generation_jobs.lane
 AND other.status='queued' AND other.available<=? AND other.touched>?
 AND (other.priority>generation_jobs.priority OR (other.priority=generation_jobs.priority AND other.created<generation_jobs.created)))`;
export const queueCapacity=(lane:string,priority:number)=>lane==='image'?(priority>=10?6:4):(priority>=10?12:10);
