// References of a problem: a citation, an optional link and the key it is cited by in the text (\cite{key}).
// Shared by the forms, their validation and the markdown renderer, so it runs in the browser too.
import type { Reference } from "@/lib/db/schema";

export type ReferenceDraft = { text: string; url: string; key?: string };

/** "A. Author, Title (2020) https://doi.org/…" with no link given → the citation and the link, apart. */
export function splitLink({ text, url }: ReferenceDraft): ReferenceDraft {
  const trimmed = { text: text.trim(), url: url.trim() };
  const found = !trimmed.url && trimmed.text.match(/https?:\/\/\S+/)?.[0];
  if (!found) return trimmed;
  return { text: trimmed.text.replace(found, "").replace(/[\s,;:–-]+$/, "").trim(), url: found };
}

/** A citation is one line: line breaks (e.g. from pasting) become spaces. */
export const oneLine = (text: string) => text.replace(/\s*\n\s*/g, " ");

export const toDrafts = (refs: Reference[]): ReferenceDraft[] => refs.map((r) => ({ text: r.text, url: r.url ?? "", key: r.key }));

/** What a key may look like: letters, digits and a few separators, as in BibTeX. */
export const CITE_KEY = /^[A-Za-z0-9][\w:.-]{0,63}$/;

/** `\cite{a}` or `\cite{a, b}`, anywhere in the text. */
const CITE = /\\cite\{([^{}\n]*)\}/g;

const PARTICLES = new Set(["van", "von", "de", "del", "della", "der", "den", "da", "di", "du", "dos", "le", "la", "ter", "ten"]);

// Letters that Unicode does not split into a base letter and an accent.
const LETTERS: Record<string, string> = { ł: "l", Ł: "L", ø: "o", Ø: "O", đ: "d", Đ: "D", ß: "ss", æ: "ae", Æ: "Ae", œ: "oe", Œ: "Oe", ı: "i" };

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[łŁøØđĐßæÆœŒı]/g, (c) => LETTERS[c]);

/**
 * A key in the style of BibTeX: the first author's surname and the year, e.g. "P. Erdős and A. Rényi, On random
 * graphs (1959)" → "erdos1959". A letter is added when the key is already `taken`: erdos1959a, erdos1959b, …
 */
export function citeKey(text: string, taken: Iterable<string> = []): string {
  const plain = ascii(text);
  // The first author: what comes before the first comma, " and " or "&". The surname is its last word, with a
  // particle before it ("Van Herstraeten" → vanherstraeten).
  const author = plain.split(/,|;|\s+and\s+|&/)[0] ?? "";
  const words = (author.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).map((w) => w.replace(/['-]/g, "").toLowerCase());
  const surname = words.length >= 2 && PARTICLES.has(words.at(-2)!) ? words.slice(-2).join("") : (words.at(-1) ?? "");
  const year = plain.match(/\((\d{4})[a-z]?\)/)?.[1] ?? plain.match(/\b(1[5-9]\d\d|20\d\d)\b/)?.[1] ?? "";
  const base = (surname || "ref") + year;
  const used = new Set([...taken].map((k) => k.toLowerCase()));
  if (!used.has(base)) return base;
  for (let i = 0; ; i++) {
    // a … z, then aa, ab, …
    const suffix = i < 26 ? String.fromCharCode(97 + i) : String.fromCharCode(97 + Math.floor(i / 26) - 1) + String.fromCharCode(97 + (i % 26));
    if (!used.has(base + suffix)) return base + suffix;
  }
}

/**
 * Every reference with a key: valid keys are kept (the first of two equal ones), the others are made from the citation.
 * References stored before keys existed get theirs here, in order, so they stay the same until the problem is saved.
 */
export function withKeys<R extends { text: string; key?: string }>(refs: R[]): (R & { key: string })[] {
  const taken = new Set<string>();
  const kept = refs.map((r) => {
    const key = r.key?.trim();
    if (!key || !CITE_KEY.test(key) || taken.has(key.toLowerCase())) return undefined;
    taken.add(key.toLowerCase());
    return key;
  });
  return refs.map((r, i) => {
    const key = kept[i] ?? citeKey(r.text, taken);
    taken.add(key.toLowerCase());
    return { ...r, key };
  });
}

/** A reference as it can be cited: its key, its number in the list (from 1), its citation and link. */
export type Citable = { key: string; n: number; text: string; url?: string };

export function citables(refs: { text: string; url?: string; key?: string }[]): Citable[] {
  return withKeys(refs).map(({ key, text, url }, i) => ({ key, n: i + 1, text, ...(url && { url }) }));
}

/** The keys of one \cite{…}: "a, b" → ["a", "b"]. */
export const citeKeys = (inside: string) =>
  inside
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

/** Splits text into plain parts and the key lists of its citations. */
export function splitCites(text: string): (string | { keys: string[] })[] {
  const parts: (string | { keys: string[] })[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ keys: citeKeys(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** The keys cited in `text` that are not among `refs`, each once. */
export function unknownCites(text: string, refs: { text: string; key?: string }[]): string[] {
  const known = new Set(withKeys(refs).map((r) => r.key));
  const cited = splitCites(text).flatMap((p) => (typeof p === "string" ? [] : p.keys));
  return [...new Set(cited.filter((k) => !known.has(k)))];
}

/** The error to show for a text citing keys that are not among the references, or undefined. */
export function unknownCitesError(text: string, refs: { text: string; key?: string }[]): string | undefined {
  const unknown = unknownCites(text, refs);
  if (!unknown.length) return undefined;
  const list = unknown.map((k) => `\\cite{${k}}`).join(", ");
  return `${list} ${unknown.length === 1 ? "does" : "do"} not match any of the references. Type \\cite{ to choose from them.`;
}

/** "\cite{a,b}" → "[1, 2]", for plain-text copies such as the Markdown download. Unknown keys become "?". */
export function citesToText(text: string, refs: { text: string; key?: string }[]): string {
  const numbers = new Map(withKeys(refs).map((r, i) => [r.key, i + 1]));
  return splitCites(text)
    .map((p) => (typeof p === "string" ? p : `[${p.keys.map((k) => numbers.get(k) ?? "?").join(", ")}]`))
    .join("");
}
