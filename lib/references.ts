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

// ---------------------------------------------------------------------------------------------------------------
// Links in a citation: only its identifiers are links (a URL, a DOI, an arXiv number), not the whole text.

/** A piece of a citation: plain text, or an identifier with where it leads. */
export type CitationPart = { text: string; href?: string };

/** A URL, a DOI ("doi:10.1000/xyz", "10.1000/xyz") or an arXiv number ("arXiv:2401.01234v2", "arXiv:math/0601001"). */
const IDENTIFIER = /(https?:\/\/[^\s<>]+)|(?:doi:\s*|DOI:?\s+)?(10\.\d{4,9}\/\S+)|arXiv:\s*((?:[a-z-]+(?:\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?)/gi;

/** "…/abc)." → "…/abc": punctuation after a URL or DOI belongs to the sentence; a closing bracket only if unmatched. */
function trimEnd(s: string): string {
  const t = s.replace(/[.,;:]+$/, "");
  if (t.endsWith(")") && t.split("(").length < t.split(")").length) return trimEnd(t.slice(0, -1));
  return t;
}

/** "https://www.arxiv.org/abs/2401.1234/" → "arxiv.org/abs/2401.1234" */
export const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** "arXiv:2401.01234" or "doi:10.1103/…" for a link to arxiv.org or doi.org; undefined for any other. */
function identifierLabel(url: string): string | undefined {
  const arxiv = url.match(/arxiv\.org\/(?:abs|pdf)\/([^?#]+?)(?:\.pdf)?\/?$/i)?.[1];
  if (arxiv) return `arXiv:${arxiv}`;
  const doi = url.match(/doi\.org\/(10\.\d{4,9}\/[^?#\s]+)/i)?.[1];
  return doi && `doi:${decodeURIComponent(doi)}`;
}

const sameDoi = (url: string, doi: string) => decodeURIComponent(url).toLowerCase().includes(doi.toLowerCase());
const sameArxiv = (url: string, id: string) => /arxiv\.org\//i.test(url) && url.includes(id.replace(/v\d+$/, ""));

/**
 * Where a journal is cited in a citation: "Phys. Rev. Lett. 125, 260404 (2020)", "J. Math. Phys. 38(5),
 * 2832–2838, 1997", "Nature 299 (1982) 802". The journal's name is a run of capitalised words and abbreviations,
 * with "of", "and", "&" … between them; then the volume, the page or article number, and the year if given.
 */
const NAME_WORD = String.raw`(?:\p{Lu}[\p{L}'’-]*\.?)`;
const JOINING_WORD = String.raw`(?:of|and|the|in|on|for|&|für|de|des|der|la|le|du|di)`;
const PAGE = String.raw`(?:[A-Za-z]{0,2}\d+(?:\s*[–—-]\s*[A-Za-z]{0,2}\d+)?)`;
const YEAR = String.raw`(?:1[6-9]|20)\d{2}`;
const JOURNAL = new RegExp(
  String.raw`(?<![\p{L}\d])${NAME_WORD}(?:\s+(?:${NAME_WORD}|${JOINING_WORD}(?=\s+\p{Lu})))*,?\s+(?:vol\.\s*)?\d+(?:\s*\(\d+\))?(?:,\s*(?:pp?\.\s*)?${PAGE}(?:\s*\(${YEAR}\)|,\s*${YEAR})?|\s+\(${YEAR}\),?\s*${PAGE})`,
  "gu",
);

const HAS_JOURNAL = new RegExp(JOURNAL.source, "u");

/** "… , " → ["…", ", "]: what is around a piece of text that a link should not cover (spaces and punctuation). */
function linkable(text: string): [before: string, core: string, after: string] {
  const m = /^([\s,;:.]*)([^]*?)([\s,;:.]*)$/u.exec(text)!;
  return [m[1], m[2], m[3]];
}

/**
 * The citation in pieces, with its identifiers as links: to the reference's `url` where that is the same work,
 * else to where the identifier resolves (doi.org, arxiv.org). With `attach`, a `url` that none of them is goes on
 * the journal the citation names ("Phys. Rev. Lett. 125, 260404 (2020)"); without one, an arXiv or DOI link is
 * added at the end as its identifier ("arXiv:2401.01234"), and any other goes on all of the citation's other
 * text. So the link is never lost.
 */
export function citationParts(text: string, url?: string, { attach = true } = {}): CitationPart[] {
  const parts: CitationPart[] = [];
  let last = 0;
  let used = false;
  for (const m of text.matchAll(IDENTIFIER)) {
    const [whole, link, doi, arxiv] = m;
    const raw = link ?? doi ?? whole;
    const id = trimEnd(raw);
    // A "doi:" before it is part of the link; punctuation after it is not.
    const shown = whole.slice(0, whole.length - (raw.length - id.length));
    let href: string;
    if (link) href = id;
    else if (doi) href = url && sameDoi(url, id) ? url : `https://doi.org/${id}`;
    else href = url && sameArxiv(url, arxiv) ? url : `https://arxiv.org/abs/${arxiv}`;
    used ||= href === url;
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: shown, href });
    last = m.index + shown.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return (attach && url && !used ? attachLink(parts, url) : parts).filter((p) => p.text);
}

/** Puts `url` on the journal reference in the plain parts; without one, after them if it is an arXiv or DOI link, else on all of them. */
function attachLink(parts: CitationPart[], url: string): CitationPart[] {
  const journal = parts.findIndex((p) => !p.href && HAS_JOURNAL.test(p.text));
  if (journal >= 0) {
    const { text } = parts[journal];
    // The last journal in the text: a citation names its authors and title first.
    const m = [...text.matchAll(JOURNAL)].at(-1)!;
    const [before, core, after] = linkable(m[0]);
    const start = m.index + before.length;
    const end = start + core.length;
    return parts.toSpliced(journal, 1, { text: text.slice(0, start) }, { text: core, href: url }, { text: after + text.slice(end + after.length) });
  }
  const label = identifierLabel(url);
  if (label) return [...parts, { text: parts.length ? " " : "" }, { text: label, href: url }];
  return parts.flatMap((p) => {
    if (p.href) return [p];
    const [before, core, after] = linkable(p.text);
    return [{ text: before }, { text: core, href: url }, { text: after }];
  });
}
