CREATE TABLE `accounts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`access_token` varchar(1000),
	`refresh_token` varchar(1000),
	`id_token` varchar(1000),
	`access_token_expires_at` datetime,
	`refresh_token_expires_at` datetime,
	`scope` varchar(500),
	`password` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_history` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`device_id` bigint NOT NULL,
	`action` varchar(50) NOT NULL,
	`previous_status` boolean,
	`new_status` boolean,
	`action_by` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`notes` varchar(1000),
	CONSTRAINT `device_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`android_id` varchar(255) NOT NULL,
	`is_approved` boolean NOT NULL DEFAULT false,
	`approved_at` datetime,
	`expires_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`notes` varchar(1000) DEFAULT NULL,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_android_id_unique` UNIQUE(`android_id`)
);
--> statement-breakpoint
CREATE TABLE `disabled_devices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`android_id` varchar(255) NOT NULL,
	`original_created_at` datetime NOT NULL,
	`was_approved` boolean NOT NULL DEFAULT false,
	`approved_at` datetime,
	`expires_at` datetime,
	`disabled_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`disabled_by` varchar(255),
	`disable_reason` varchar(1000),
	`original_notes` varchar(1000),
	CONSTRAINT `disabled_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `disabled_devices_android_id_unique` UNIQUE(`android_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`pro_code` varchar(50) NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`description` varchar(1000),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_pro_code_unique` UNIQUE(`pro_code`)
);
--> statement-breakpoint
CREATE TABLE `rejected_devices` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`android_id` varchar(255) NOT NULL,
	`original_created_at` datetime NOT NULL,
	`rejected_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`rejected_by` varchar(255),
	`rejection_reason` varchar(1000),
	`original_notes` varchar(1000),
	CONSTRAINT `rejected_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `rejected_devices_android_id_unique` UNIQUE(`android_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`expires_at` datetime NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`ip_address` varchar(255),
	`user_agent` varchar(1000),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` varchar(1000),
	`role` varchar(50) NOT NULL DEFAULT 'user',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `device_history` ADD CONSTRAINT `device_history_device_id_devices_id_fk` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE cascade ON UPDATE no action;