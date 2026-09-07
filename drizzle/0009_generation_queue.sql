CREATE TABLE `generation_jobs` (
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
CREATE INDEX `generation_jobs_lane_status` ON `generation_jobs` (`lane`,`status`,`lease`);--> statement-breakpoint
CREATE INDEX `generation_jobs_scope` ON `generation_jobs` (`scope`);