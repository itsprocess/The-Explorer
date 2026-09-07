CREATE TABLE `character_presence` (
	`character` text PRIMARY KEY NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `character_presence_seen` ON `character_presence` (`seen`);