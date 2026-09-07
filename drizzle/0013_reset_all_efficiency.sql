-- User-authorized full reset, including all app accounts. Preserve only deletion receipts.
INSERT OR IGNORE INTO server_settings(key,value)
SELECT 'retired-image:' || key, json_extract(value,'$.objectKey') FROM packages
WHERE kind='image' AND value IS NOT NULL AND json_extract(value,'$.objectKey') IS NOT NULL;
--> statement-breakpoint
DELETE FROM character_sessions;
--> statement-breakpoint
DELETE FROM character_credentials;
--> statement-breakpoint
DELETE FROM character_presence;
--> statement-breakpoint
DELETE FROM visits;
--> statement-breakpoint
DELETE FROM claims;
--> statement-breakpoint
DELETE FROM characters;
--> statement-breakpoint
DELETE FROM auth_attempts;
--> statement-breakpoint
DELETE FROM packages;
--> statement-breakpoint
DELETE FROM generation_jobs;
--> statement-breakpoint
DELETE FROM generation_usage;
--> statement-breakpoint
DELETE FROM server_settings WHERE key NOT LIKE 'retired-image:%';
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES('bootstrap_disabled','1');
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES('provider_pause','{"code":"provider_credit","message":"Generation is paused because the OpenAI account is out of API credit. Add credit, then retry generation.","until":null}');
