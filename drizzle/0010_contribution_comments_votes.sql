CREATE TABLE "contribution_vote" (
	"contribution_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contribution_vote_contribution_id_user_id_pk" PRIMARY KEY("contribution_id","user_id"),
	CONSTRAINT "contribution_vote_value_check" CHECK ("contribution_vote"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "contribution_id" uuid;--> statement-breakpoint
ALTER TABLE "contribution_vote" ADD CONSTRAINT "contribution_vote_contribution_id_contribution_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contribution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_vote" ADD CONSTRAINT "contribution_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contribution_vote_user_idx" ON "contribution_vote" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_contribution_id_contribution_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contribution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_contribution_status_idx" ON "comment" USING btree ("contribution_id","status");--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_contribution_check" CHECK ("comment"."contribution_id" is null or "comment"."problem_id" is not null);