CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`source` enum('kalshi','polymarket','sw1sh') NOT NULL,
	`sourceUrl` text,
	`sport` varchar(64),
	`type` enum('sports','narrative','culture','trend','creator','ai') NOT NULL DEFAULT 'sports',
	`statement` text NOT NULL,
	`subtext` text,
	`odds` varchar(32),
	`oddsNumeric` decimal(8,2) NOT NULL DEFAULT '100',
	`confidence` int DEFAULT 60,
	`aiConfidence` int,
	`narrative` text,
	`image` text,
	`gameTime` varchar(128),
	`isLive` boolean DEFAULT false,
	`status` enum('active','settled','cancelled') NOT NULL DEFAULT 'active',
	`tags` json DEFAULT ('[]'),
	`rawData` json,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`),
	CONSTRAINT `bets_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`source` enum('youtube','espn','manual') NOT NULL DEFAULT 'youtube',
	`title` text NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`channelName` varchar(255),
	`sport` varchar(64),
	`duration` int,
	`viewCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`linkedBetId` int,
	`tags` json DEFAULT ('[]'),
	`publishedAt` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clips_id` PRIMARY KEY(`id`),
	CONSTRAINT `clips_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `placed_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`betId` int,
	`externalBetId` varchar(255),
	`statement` text NOT NULL,
	`odds` varchar(32),
	`oddsNumeric` decimal(8,2) NOT NULL,
	`stake` decimal(10,2) NOT NULL,
	`potentialPayout` decimal(10,2) NOT NULL,
	`status` enum('active','won','lost','cancelled') NOT NULL DEFAULT 'active',
	`sport` varchar(64),
	`source` varchar(64),
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`settledAt` timestamp,
	CONSTRAINT `placed_bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`betId` int,
	`externalBetId` varchar(255),
	`statement` text NOT NULL,
	`odds` varchar(32),
	`sport` varchar(64),
	`source` varchar(64),
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `balance` decimal(10,2) DEFAULT '1000.00' NOT NULL;