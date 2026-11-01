// Field parsers shared by the submission forms and the admin problem editor.
import { z } from "zod";
import type { Reference } from "@/lib/db/schema";
import { splitLink } from "@/lib/references";

export const text = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .min(min, min <= 1 ? `Please enter ${what}.` : `Please write at least ${min} characters.`)
    .max(max, `Please keep this under ${max.toLocaleString("en")} characters.`);

export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .pipe(z.url({ protocol: /^https?$/, error: "Please enter a full link starting with https://" }).optional());

export const slug = z.string().trim().min(1);

/** "a, b ,, c" → ["a", "b", "c"] */
export const commaList = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

/** The reference rows of a form (see useReferenceRows), one array per column. */
export const referenceRows = {
  "referenceText[]": z.array(z.string().trim()).default([]),
  "referenceUrl[]": z.array(z.string().trim()).default([]),
};

const webUrl = z.url({ protocol: /^https?$/ });

/**
 * The rows as references. Rows left empty are skipped; a link pasted into the citation is moved to the link.
 * `errors` names each row that is not valid, by its number in the list; the forms show them together.
 */
export function toReferences(texts: string[], urls: string[]): { references: Reference[]; errors: string[] } {
  const references: Reference[] = [];
  const errors: string[] = [];
  texts.forEach((t, i) => {
    const { text, url } = splitLink({ text: t, url: urls[i] ?? "" });
    if (!text && !url) return;
    const problem = !text
      ? "needs a citation, not only a link"
      : text.length > 1_000
        ? "is too long; please keep the citation under 1,000 characters"
        : url && !webUrl.safeParse(url).success
          ? "needs a full link starting with https://"
          : null;
    if (problem) errors.push(`Reference ${i + 1} ${problem}.`);
    else references.push(url ? { text, url } : { text });
  });
  if (references.length > 200) errors.push("Please list at most 200 references.");
  return { references, errors };
}
