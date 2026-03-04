CREATE TABLE `dashboards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`code` text,
	`widgets` text,
	`config` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dashboards_code_unique` ON `dashboards` (`code`);--> statement-breakpoint
CREATE TABLE `installations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`status` text,
	`no` integer,
	`bast_and_retention_date` text,
	`bast_document_date` text,
	`project_code` text,
	`project_name` text,
	`location` text,
	`capacity` real,
	`unit` text,
	`pm` text,
	`admin` text,
	`sm` text,
	`plan_oh` integer,
	`actual_oh` integer,
	`manpower_update` integer,
	`epc` text,
	`developer` text,
	`roof_type` text,
	`progress_data` text,
	`synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_date` integer,
	`pm` text NOT NULL,
	`project_name` text,
	`notes` text,
	`year` integer NOT NULL,
	`synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `procurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`status` text,
	`no` integer,
	`project_code` text,
	`project_name` text,
	`location` text,
	`pm` text,
	`admin` text,
	`epc` text,
	`notes` text,
	`synced_at` integer
);
