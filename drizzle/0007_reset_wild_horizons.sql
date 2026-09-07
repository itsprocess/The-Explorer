-- Custom SQL migration file, put your code below! --
-- Retain only object deletion receipts while retiring the generated world.
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
UPDATE characters SET value=json_set(value,'$.x',0,'$.y',0,'$.alive',json('true'),'$.deaths',0,'$.furthest',0,'$.badges',json('[]'),'$.consumed',json('[]')),revision=revision+1,last_op=NULL;
