ALTER TABLE "problem_proposal" DROP CONSTRAINT "problem_proposal_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "problem_revision" DROP CONSTRAINT "problem_revision_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "problem_proposal" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_revision" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_proposal" ADD CONSTRAINT "problem_proposal_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_revision" ADD CONSTRAINT "problem_revision_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;