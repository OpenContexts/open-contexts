CREATE TABLE "submissions_seen" (
	"user_id" text PRIMARY KEY NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"new_since" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "submissions_seen" ADD CONSTRAINT "submissions_seen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_parent_idx" ON "comment" USING btree ("parent_id");--> statement-breakpoint
-- Existing accounts start with nothing new: only decisions from now on are counted.
INSERT INTO "submissions_seen" ("user_id", "new_since") SELECT "id", now() FROM "user";