ALTER TABLE "problem_revision" ADD COLUMN "credit" text;--> statement-breakpoint
ALTER TABLE "problem_revision" ADD COLUMN "ai_use" "ai_use";--> statement-breakpoint
ALTER TABLE "problem_version" ADD COLUMN "credit" text;--> statement-breakpoint
ALTER TABLE "problem_version" ADD COLUMN "ai_use" "ai_use";--> statement-breakpoint
ALTER TABLE "problem_version" ADD COLUMN "revision_id" uuid;--> statement-breakpoint
-- Edits submitted before credit was asked: credited to their author's account name.
UPDATE "problem_revision" r SET "credit" = u."name" FROM "user" u WHERE u."id" = r."author_id" AND r."credit" IS NULL;
--> statement-breakpoint
-- Versions that came from an accepted edit: matched by problem and change summary, the latest such edit.
UPDATE "problem_version" pv SET "revision_id" = r."id", "credit" = r."credit", "ai_use" = r."ai_use"
FROM (
  SELECT DISTINCT ON ("problem_id", "change_summary") "id", "problem_id", "change_summary", "credit", "ai_use"
  FROM "problem_revision" WHERE "status" = 'approved'
  ORDER BY "problem_id", "change_summary", "reviewed_at" DESC NULLS LAST
) r
WHERE pv."version" > 1 AND pv."revision_id" IS NULL AND r."problem_id" = pv."problem_id" AND r."change_summary" = pv."change_summary";
--> statement-breakpoint
-- History entries of edits: the version they started, matched by their text and the version's change summary.
UPDATE "problem" p SET "history" = (
  SELECT jsonb_agg(
    CASE WHEN h.e->>'kind' IN ('edit', 'status') AND NOT h.e ? 'version' AND v."version" IS NOT NULL
      THEN h.e || jsonb_build_object('version', v."version") ELSE h.e END
    ORDER BY h.i)
  FROM jsonb_array_elements(p."history") WITH ORDINALITY AS h(e, i)
  LEFT JOIN LATERAL (
    SELECT max(pv."version") AS "version" FROM "problem_version" pv
    WHERE pv."problem_id" = p."id" AND pv."version" > 1 AND pv."change_summary" = h.e->>'text'
  ) v ON true
)
WHERE jsonb_array_length(p."history") > 0;
