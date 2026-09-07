CREATE TABLE `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `character_credentials` (
	`character` text PRIMARY KEY NOT NULL,
	`name_key` text NOT NULL,
	`password_hash` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `character_names_global_unique` ON `character_credentials` (`name_key`);--> statement-breakpoint
CREATE TABLE `character_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `character_sessions_expiry` ON `character_sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `server_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
