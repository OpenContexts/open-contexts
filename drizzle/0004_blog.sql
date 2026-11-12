ALTER TYPE "public"."log_target_type" ADD VALUE 'post' BEFORE 'problem';--> statement-breakpoint
CREATE TABLE "blog_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"authors" text[] NOT NULL,
	"body" text NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author_id" text,
	"published_at" timestamp with time zone,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "problem_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "post_id" uuid;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_status_created_idx" ON "blog_post" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_post_status_idx" ON "comment" USING btree ("post_id","status");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_target_check" CHECK (("comment"."problem_id" is null) <> ("comment"."post_id" is null));