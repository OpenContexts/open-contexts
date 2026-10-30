-- Submissions whose problem no longer exists cannot be kept once problem_id is required.
DELETE FROM "comment" WHERE "problem_id" IS NULL;--> statement-breakpoint
DELETE FROM "contribution" WHERE "problem_id" IS NULL;--> statement-breakpoint
DELETE FROM "problem_revision" WHERE "problem_id" IS NULL;--> statement-breakpoint
DELETE FROM "problem_link" WHERE "from_problem_id" IS NULL OR ("to_slug" IS NOT NULL AND "to_problem_id" IS NULL);--> statement-breakpoint
ALTER TABLE "problem_revision" DROP CONSTRAINT "problem_revision_base_revision_id_problem_revision_id_fk";
--> statement-breakpoint
DROP INDEX "problem_proposal_slug_idx";--> statement-breakpoint
DROP INDEX "problem_proposal_number_idx";--> statement-breakpoint
DROP INDEX "comment_problem_status_idx";--> statement-breakpoint
DROP INDEX "contribution_problem_status_idx";--> statement-breakpoint
DROP INDEX "problem_link_from_status_idx";--> statement-breakpoint
DROP INDEX "problem_link_to_status_idx";--> statement-breakpoint
DROP INDEX "problem_revision_problem_status_idx";--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "problem_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contribution" ALTER COLUMN "problem_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_link" ALTER COLUMN "from_problem_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_revision" ALTER COLUMN "problem_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "comment_problem_status_idx" ON "comment" USING btree ("problem_id","status");--> statement-breakpoint
CREATE INDEX "contribution_problem_status_idx" ON "contribution" USING btree ("problem_id","status");--> statement-breakpoint
CREATE INDEX "problem_link_from_status_idx" ON "problem_link" USING btree ("from_problem_id","status");--> statement-breakpoint
CREATE INDEX "problem_link_to_status_idx" ON "problem_link" USING btree ("to_problem_id","status");--> statement-breakpoint
CREATE INDEX "problem_revision_problem_status_idx" ON "problem_revision" USING btree ("problem_id","status");--> statement-breakpoint
ALTER TABLE "comment" DROP COLUMN "problem_slug";--> statement-breakpoint
ALTER TABLE "contribution" DROP COLUMN "problem_slug";--> statement-breakpoint
ALTER TABLE "problem_link" DROP COLUMN "from_slug";--> statement-breakpoint
ALTER TABLE "problem_link" DROP COLUMN "to_slug";--> statement-breakpoint
ALTER TABLE "problem_proposal" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "problem_proposal" DROP COLUMN "number";--> statement-breakpoint
ALTER TABLE "problem_revision" DROP COLUMN "problem_slug";--> statement-breakpoint
ALTER TABLE "problem_revision" DROP COLUMN "base_revision_id";