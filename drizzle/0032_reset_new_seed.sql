-- Owner-requested new-seed world reset. Current project rules preserve identity and logins.
DELETE FROM character_presence;
--> statement-breakpoint
DELETE FROM visits;
--> statement-breakpoint
DELETE FROM claims;
--> statement-breakpoint
DELETE FROM generation_jobs;
--> statement-breakpoint
DELETE FROM generation_usage;
--> statement-breakpoint
DELETE FROM packages;
--> statement-breakpoint
DELETE FROM server_settings;
--> statement-breakpoint
UPDATE characters SET value=json_object(
 'id',id,'name',json_extract(value,'$.name'),'definingTrait',json_extract(value,'$.definingTrait'),
 'x',0,'y',0,'alive',json('true'),'deaths',0,'furthest',0,
 'distanceLife',0,'distanceTotal',0,'relicsLife',0,'relicsTotal',0,
 'badges',json('[]'),'consumed',json('[]'),'traits',json('[]')
),revision=revision+1,last_op=NULL;
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES ('bootstrap_disabled','1');
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES ('dev-image-reset-20260908','0');
