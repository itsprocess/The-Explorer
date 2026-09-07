-- User-requested reset for the new sparse world. Keep names and password logins.
DELETE FROM packages;
--> statement-breakpoint
DELETE FROM visits;
--> statement-breakpoint
DELETE FROM claims;
--> statement-breakpoint
UPDATE characters SET value=json_set(value,'$.x',0,'$.y',0,'$.alive',json('true'),'$.deaths',0,'$.furthest',0,'$.badges',json('[]'),'$.consumed',json('[]')),revision=revision+1,last_op=NULL;
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES ('bootstrap_disabled','1') ON CONFLICT(key) DO UPDATE SET value='1';
