DROP TABLE "problem_link" CASCADE;--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "target_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."submission_type";--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('comment', 'contribution', 'revision', 'proposal', 'problem');--> statement-breakpoint
ALTER TABLE "moderation_log" ALTER COLUMN "target_type" SET DATA TYPE "public"."submission_type" USING "target_type"::"public"."submission_type";--> statement-breakpoint
DROP TYPE "public"."link_relation";