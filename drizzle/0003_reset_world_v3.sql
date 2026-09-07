-- User-requested full database reset for the illustrated world.
DELETE FROM character_sessions;
--> statement-breakpoint
DELETE FROM character_credentials;
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
DELETE FROM server_settings;
