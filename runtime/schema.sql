-- Portable schema v1. Historical world-reset migrations are intentionally excluded.
CREATE TABLE IF NOT EXISTS `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_op` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `characters_owner_updated` ON `characters` (`owner`,`updated`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `claims` (
	`key` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`operation` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `packages` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` text,
	`token` text,
	`lease` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`value` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `visits_character_at` ON `visits` (`character`,`at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `visits_cell_at` ON `visits` (`x`,`y`,`at`);
CREATE TABLE IF NOT EXISTS `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `character_credentials` (
	`character` text PRIMARY KEY NOT NULL,
	`name_key` text NOT NULL,
	`password_hash` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `character_names_global_unique` ON `character_credentials` (`name_key`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `character_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `character_sessions_expiry` ON `character_sessions` (`expires`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `server_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `generation_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`lane` text NOT NULL,
	`scope` text NOT NULL,
	`request` text NOT NULL,
	`status` text NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL,
	`result` text,
	`error` text,
	`token` text,
	`lease` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`touched` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `generation_jobs_lane_status` ON `generation_jobs` (`lane`,`status`,`lease`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `generation_jobs_scope` ON `generation_jobs` (`scope`);
CREATE TABLE IF NOT EXISTS `character_presence` (
	`character` text PRIMARY KEY NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `character_presence_seen` ON `character_presence` (`seen`);
CREATE TABLE IF NOT EXISTS `generation_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`lane` text NOT NULL,
	`stage` text NOT NULL,
	`model` text NOT NULL,
	`status` text NOT NULL,
	`usage` text,
	`duration` integer,
	`response_id` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `generation_usage_scope` ON `generation_usage` (`scope`);