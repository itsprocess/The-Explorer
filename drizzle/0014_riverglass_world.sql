-- User-requested new world. Preserve accounts, credentials and sessions.
INSERT OR IGNORE INTO server_settings(key,value)
SELECT 'retired-image:' || key, json_extract(value,'$.objectKey') FROM packages
WHERE kind='image' AND value IS NOT NULL AND json_extract(value,'$.objectKey') IS NOT NULL;
--> statement-breakpoint
DELETE FROM packages;
--> statement-breakpoint
DELETE FROM visits;
--> statement-breakpoint
DELETE FROM claims;
--> statement-breakpoint
DELETE FROM character_presence;
--> statement-breakpoint
DELETE FROM generation_jobs;
--> statement-breakpoint
DELETE FROM generation_usage;
--> statement-breakpoint
DELETE FROM server_settings WHERE key LIKE '%:diagnostic';
--> statement-breakpoint
UPDATE characters SET value=json_set(json_remove(value,'$.pendingTransport'),'$.x',0,'$.y',0,'$.alive',json('true'),'$.deaths',0,'$.furthest',0,'$.badges',json('[]'),'$.consumed',json('[]'),'$.traits',json('[]')),revision=revision+1,last_op=NULL;
