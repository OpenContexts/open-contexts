-- Problem keys lose their ".0": "12.0" becomes "12" (versions, "12v3", are not stored as keys). A no-op on
-- databases created after 0005 was changed to write the new form.
UPDATE "permalink" SET "key" = "problem_number"::text WHERE "target" = 'problem' AND "key" <> "problem_number"::text;
