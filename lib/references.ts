// References of a problem: a citation and an optional link. Shared by the forms and their validation.
import type { Reference } from "@/lib/db/schema";

export type ReferenceDraft = { text: string; url: string };

/** "A. Author, Title (2020) https://doi.org/…" with no link given → the citation and the link, apart. */
export function splitLink({ text, url }: ReferenceDraft): ReferenceDraft {
  const trimmed = { text: text.trim(), url: url.trim() };
  const found = !trimmed.url && trimmed.text.match(/https?:\/\/\S+/)?.[0];
  if (!found) return trimmed;
  return { text: trimmed.text.replace(found, "").replace(/[\s,;:–-]+$/, "").trim(), url: found };
}

/** A citation is one line: line breaks (e.g. from pasting) become spaces. */
export const oneLine = (text: string) => text.replace(/\s*\n\s*/g, " ");

export const toDrafts = (refs: Reference[]): ReferenceDraft[] => refs.map((r) => ({ text: r.text, url: r.url ?? "" }));
