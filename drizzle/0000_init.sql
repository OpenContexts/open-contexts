CREATE TYPE "public"."ai_use" AS ENUM('none', 'partial', 'full');--> statement-breakpoint
CREATE TYPE "public"."contribution_kind" AS ENUM('claim', 'partial', 'negative', 'reformulation', 'decomposition', 'evidence', 'verification', 'exposition', 'challenge', 'question', 'reference');--> statement-breakpoint
CREATE TYPE "public"."link_relation" AS ENUM('related', 'generalizes', 'special-case', 'depends-on', 'equivalent');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('approve', 'reject', 'reopen');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."problem_status" AS ENUM('open', 'under-revision', 'solved');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('comment', 'contribution', 'link', 'revision');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_slug" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_slug" text NOT NULL,
	"author_id" text NOT NULL,
	"kind" "contribution_kind" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"url" text,
	"ai_use" "ai_use" DEFAULT 'none' NOT NULL,
	"credit" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "submission_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"action" "moderation_action" NOT NULL,
	"moderator_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_slug" text NOT NULL,
	"to_slug" text,
	"url" text,
	"label" text,
	"relation" "link_relation" DEFAULT 'related' NOT NULL,
	"note" text,
	"proposed_by_id" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_slug" text NOT NULL,
	"author_id" text NOT NULL,
	"base_revision_id" uuid,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"body" text NOT NULL,
	"problem_status" "problem_status" NOT NULL,
	"change_summary" text NOT NULL,
	"status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_moderator_id_user_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_link" ADD CONSTRAINT "problem_link_proposed_by_id_user_id_fk" FOREIGN KEY ("proposed_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_link" ADD CONSTRAINT "problem_link_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_revision" ADD CONSTRAINT "problem_revision_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_revision" ADD CONSTRAINT "problem_revision_base_revision_id_problem_revision_id_fk" FOREIGN KEY ("base_revision_id") REFERENCES "public"."problem_revision"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_revision" ADD CONSTRAINT "problem_revision_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "comment_problem_status_idx" ON "comment" USING btree ("problem_slug","status");--> statement-breakpoint
CREATE INDEX "comment_status_created_idx" ON "comment" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contribution_problem_status_idx" ON "contribution" USING btree ("problem_slug","status");--> statement-breakpoint
CREATE INDEX "contribution_status_created_idx" ON "contribution" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "moderation_log_target_idx" ON "moderation_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "problem_link_from_status_idx" ON "problem_link" USING btree ("from_slug","status");--> statement-breakpoint
CREATE INDEX "problem_link_to_status_idx" ON "problem_link" USING btree ("to_slug","status");--> statement-breakpoint
CREATE INDEX "problem_link_status_created_idx" ON "problem_link" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "problem_revision_problem_status_idx" ON "problem_revision" USING btree ("problem_slug","status");--> statement-breakpoint
CREATE INDEX "problem_revision_status_created_idx" ON "problem_revision" USING btree ("status","created_at");