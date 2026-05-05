ALTER TABLE "notifications" ADD COLUMN "type" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "error_message" text;