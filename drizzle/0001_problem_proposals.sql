ALTER TYPE "public"."submission_type" ADD VALUE 'proposal';--> statement-breakpoint
CREATE TABLE "problem_proposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"body" text NOT NULL,
	"areas" text[] NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"posed_by" text[] NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_use" "ai_use" DEFAULT 'none' NOT NULL,
	"slug" text,
	"number" integer,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_proposal" ADD CONSTRAINT "problem_proposal_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_proposal" ADD CONSTRAINT "problem_proposal_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_proposal_status_created_idx" ON "problem_proposal" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_proposal_slug_idx" ON "problem_proposal" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_proposal_number_idx" ON "problem_proposal" USING btree ("number");