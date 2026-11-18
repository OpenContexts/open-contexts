-- Contributions accepted before this change get the entry in their problem's "Progress and history" that an
-- acceptance now adds (CONTRIBUTION_HISTORY_KINDS in lib/constants.ts, recordInHistory in app/admin/actions.ts):
-- dated the day of the acceptance, with the kind's label and the title, and linked by the contribution's key.
UPDATE "problem" p
SET "history" = p."history" || e."entries"
FROM (
  SELECT
    c."problem_id",
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(coalesce(c."reviewed_at", c."created_at") AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
        'kind', CASE c."kind"
          WHEN 'reformulation' THEN 'posed'
          WHEN 'decomposition' THEN 'posed'
          WHEN 'exposition' THEN 'note'
          WHEN 'challenge' THEN 'note'
          ELSE 'advance'
        END,
        'text', CASE c."kind"
          WHEN 'claim' THEN 'Claimed solution'
          WHEN 'partial' THEN 'Partial result'
          WHEN 'negative' THEN 'Negative result'
          WHEN 'reformulation' THEN 'Reformulation'
          WHEN 'decomposition' THEN 'Decomposition into further problems'
          WHEN 'evidence' THEN 'Computational evidence'
          WHEN 'verification' THEN 'Independent verification'
          WHEN 'exposition' THEN 'Explanatory exposition'
          WHEN 'challenge' THEN 'Challenge to a solution'
        END || ': ' || c."title",
        'contribution', pl."key"
      )
      ORDER BY coalesce(c."reviewed_at", c."created_at")
    ) AS "entries"
  FROM "contribution" c
  JOIN "permalink" pl ON pl."target" = 'contribution' AND pl."target_id" = c."id"
  JOIN "problem" p2 ON p2."id" = c."problem_id"
  WHERE c."status" = 'approved'
    AND c."kind" <> 'reference'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p2."history") h WHERE h ->> 'contribution' = pl."key")
  GROUP BY c."problem_id"
) e
WHERE p."id" = e."problem_id";
