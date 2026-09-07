CREATE TABLE `generation_usage` (
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
CREATE INDEX `generation_usage_scope` ON `generation_usage` (`scope`);