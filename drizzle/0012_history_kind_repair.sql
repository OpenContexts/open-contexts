-- Saving a problem in the editor could turn the kind of each of its history entries into "posed" (the form reset
-- after a save showed the first kind in every row; see EntryInputs in components/admin/history-field.tsx). The
-- entries that say where they came from get their kind back: an accepted contribution's by its kind
-- (CONTRIBUTION_HISTORY_KINDS in lib/constants.ts), a change of status "status", and an edit of the text "edit".
-- Entries without such a link can't be told apart from ones that really are "posed", so they stay.
UPDATE "problem" p
SET "history" = (
  SELECT jsonb_agg(
    CASE
      WHEN h ->> 'kind' <> 'posed' THEN h
      WHEN h ? 'contribution' THEN jsonb_set(h, '{kind}', to_jsonb(coalesce((
        SELECT CASE c."kind"
          WHEN 'reformulation' THEN 'posed'
          WHEN 'decomposition' THEN 'posed'
          WHEN 'exposition' THEN 'note'
          WHEN 'challenge' THEN 'note'
          ELSE 'advance'
        END
        FROM "permalink" pl
        JOIN "contribution" c ON c."id" = pl."target_id"
        WHERE pl."target" = 'contribution' AND pl."key" = h ->> 'contribution'
      ), 'posed')))
      WHEN h ? 'status' THEN jsonb_set(h, '{kind}', '"status"')
      WHEN h ? 'version' THEN jsonb_set(h, '{kind}', '"edit"')
      ELSE h
    END
    ORDER BY i
  )
  FROM jsonb_array_elements(p."history") WITH ORDINALITY AS e(h, i)
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(p."history") h
  WHERE h ->> 'kind' = 'posed' AND (h ? 'contribution' OR h ? 'status' OR h ? 'version')
);
