CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_op` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `characters_owner_updated` ON `characters` (`owner`,`updated`);--> statement-breakpoint
CREATE TABLE `claims` (
	`key` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`operation` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`key` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` text,
	`token` text,
	`lease` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`character` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`value` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_character_at` ON `visits` (`character`,`at`);--> statement-breakpoint
CREATE INDEX `visits_cell_at` ON `visits` (`x`,`y`,`at`);