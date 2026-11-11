CREATE TABLE `roll_receipts` (
	`receipt_key` text PRIMARY KEY NOT NULL,
	`declaration_hash` text NOT NULL,
	`raw_roll` integer,
	`created_at` text NOT NULL
);
