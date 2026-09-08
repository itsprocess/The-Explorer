-- Explicit owner authorization: all existing accounts and world content are disposable dev data.
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
DELETE FROM generation_jobs;
--> statement-breakpoint
DELETE FROM generation_usage;
--> statement-breakpoint
DELETE FROM packages;
--> statement-breakpoint
DELETE FROM server_settings;
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES ('bootstrap_disabled','1');
--> statement-breakpoint
INSERT INTO server_settings(key,value) VALUES ('dev-image-reset-20260908','0');
