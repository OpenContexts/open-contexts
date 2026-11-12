ALTER TYPE "public"."log_action" ADD VALUE 'publish';--> statement-breakpoint
ALTER TYPE "public"."log_action" ADD VALUE 'unpublish';--> statement-breakpoint
ALTER TABLE "problem" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
-- The problems so far are the fixed list of the first cycle (the companion paper): all published, as of the day they were added.
UPDATE "problem" SET "published_at" = "created_at";