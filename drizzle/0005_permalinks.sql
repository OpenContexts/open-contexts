CREATE TYPE "public"."permalink_target" AS ENUM('problem', 'contribution', 'post');--> statement-breakpoint
CREATE TABLE "permalink" (
	"key" text PRIMARY KEY NOT NULL,
	"target" "permalink_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"problem_number" integer,
	"seq" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permalink_target_unique" UNIQUE("target","target_id"),
	CONSTRAINT "permalink_problem_number_check" CHECK (("permalink"."target" = 'post') = ("permalink"."problem_number" is null))
);
--> statement-breakpoint
CREATE TABLE "problem_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"problem_number" integer NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"body" text NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "problem_version_number_unique" UNIQUE("problem_number","version")
);
--> statement-breakpoint
CREATE INDEX "permalink_problem_number_idx" ON "permalink" USING btree ("problem_number");--> statement-breakpoint
CREATE INDEX "problem_version_problem_idx" ON "problem_version" USING btree ("problem_id");--> statement-breakpoint
-- Backfill: the current text of every problem becomes its version 1, and everything already accepted gets its
-- key, numbered in the order it was accepted. The kinds are PERMALINK_KINDS in lib/constants.ts.
INSERT INTO "problem_version" ("problem_id", "problem_number", "version", "title", "statement", "body", "references", "created_at", "updated_at")
SELECT "id", "number", 1, "title", "statement", "body", "references", "updated_at", "updated_at" FROM "problem";--> statement-breakpoint
INSERT INTO "permalink" ("key", "target", "target_id", "problem_number", "seq")
SELECT "number"::text, 'problem', "id", "number", 0 FROM "problem";--> statement-breakpoint
INSERT INTO "permalink" ("key", "target", "target_id", "problem_number", "seq")
SELECT p."number" || '.' || c."seq", 'contribution', c."id", p."number", c."seq"
FROM (
	SELECT "id", "problem_id", row_number() OVER (PARTITION BY "problem_id" ORDER BY coalesce("reviewed_at", "created_at"), "created_at") AS "seq"
	FROM "contribution"
	WHERE "status" = 'approved'
		AND "kind" IN ('claim', 'partial', 'negative', 'reformulation', 'decomposition', 'evidence', 'verification', 'exposition', 'challenge')
) c
JOIN "problem" p ON p."id" = c."problem_id";--> statement-breakpoint
INSERT INTO "permalink" ("key", "target", "target_id", "seq")
SELECT 'blog.' || b."seq", 'post', b."id", b."seq"
FROM (
	SELECT "id", row_number() OVER (ORDER BY "published_at", "created_at") AS "seq"
	FROM "blog_post"
	WHERE "status" = 'approved' AND "published_at" IS NOT NULL
) b;
