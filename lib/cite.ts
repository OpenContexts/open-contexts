// Citations: a BibTeX entry for each problem and for the database, in the format of the prototype.
// Plain functions of their inputs, so the browser can build them on a click with the day's date.
import { AI_USE_LABELS, type AiUse, CONTRIBUTION_KIND_LABELS, type ContributionKind, PROBLEM_STATUS_LABELS } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";
import { permalinkPath, problemKey } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

/** `version`: the version cited, named in the entry; it links to the problem's permanent key either way. */
export type CitableProblem = Pick<Problem, "number" | "slug" | "title" | "posedBy" | "posed" | "status" | "updated"> & { version?: number };

/** `accepted`: "YYYY-MM-DD". */
export type CitableContribution = {
  key: string;
  kind: ContributionKind;
  title: string;
  credit: string;
  aiUse: AiUse;
  accepted: string;
  problem: { number: number; title: string };
};

/** Where the entry is cited from and when: the site's address without a trailing slash, and today as "YYYY-MM-DD". */
export type CiteContext = { origin: string; today: string };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KEY = SITE.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Escapes LaTeX's special characters, except inside $…$ math. Braces and backslashes in plain text are dropped. */
function escape(text: string): string {
  return text
    .split(/(\$[^$]+\$)/)
    .map((part, i) => (i % 2 ? part : part.replace(/[\\{}]/g, "").replace(/([&%$#_])/g, "\\$1")))
    .join("");
}

/**
 * A name for BibTeX's author list. Collaborations and teams are braced, so BibTeX doesn't split them into a
 * first and last name; a trailing "(Institution)" is dropped.
 */
function author(name: string): string {
  const n = escape(name.replace(/\s*\([^)]*\)\s*$/, "").trim());
  return /\b(collaboration|team|group|consortium|project)\b/i.test(n) ? `{${n}}` : n;
}

/** "2026-10-03" → "3 October 2026", "1998-09" → "September 1998", "1967" → "1967": months spelled out, as in print. */
function longDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!m) return y;
  return [d && Number(d), MONTH_NAMES[Number(m) - 1], y].filter(Boolean).join(" ");
}

function entry(key: string, fields: [string, string | undefined][], type = "misc"): string {
  const lines = fields.filter(([, v]) => v !== undefined).map(([k, v]) => `  ${k.padEnd(13)} = ${v}`);
  return `@${type}{${key},\n${lines.join(",\n")}\n}`;
}

/**
 * The problem's entry. Its author and date are those of the problem as posed; with no posers recorded, the
 * database is the author. It links to the problem's permanent key ("12"), which always shows the current version.
 */
export function problemBibtex(p: CitableProblem, { origin, today }: CiteContext): string {
  const authors = p.posedBy.map(author).filter(Boolean);
  const [year, month] = p.posed.split("-");
  const version = p.version ? `, version ${p.version}` : "";
  return entry(`${KEY}-problem-${p.number}`, [
    ["author", authors.length ? `{${authors.join(" and ")}}` : `{{${SITE.name}}}`],
    ["title", `{{${escape(p.title)}}}`],
    ["howpublished", `{${escape(`${SITE.name}: ${SITE.subtitle}`)}, Problem ${p.number}${version}}`],
    ["year", `{${year}}`],
    ["month", month ? MONTHS[Number(month) - 1] : undefined],
    ["date", `{${p.posed}}`],
    ["url", `{${origin}${permalinkPath(problemKey(p.number))}}`],
    ["urldate", `{${today}}`],
    ["note", `{Problem posed ${longDate(p.posed)}; status: ${PROBLEM_STATUS_LABELS[p.status]}, last updated ${longDate(p.updated)}}`],
  ]);
}

/**
 * The credited names of a contribution, which are free text ("A. Smith (Ulm), B. Jones and C. Lee"): split at
 * commas, semicolons and "and", except inside parentheses.
 */
export function creditNames(credit: string): string[] {
  const names: string[] = [];
  let depth = 0;
  let current = "";
  for (const part of credit.split(/(\s+and\s+|[,;()])/)) {
    if (part === "(") depth++;
    if (part === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && (part === "," || part === ";" || /^\s+and\s+$/.test(part))) {
      names.push(current);
      current = "";
    } else current += part;
  }
  return [...names, current].map((n) => n.trim()).filter(Boolean);
}

/** A contribution's entry, dated by its acceptance and linked by its permanent key ("12.3"). */
export function contributionBibtex(c: CitableContribution, { origin, today }: CiteContext): string {
  const authors = creditNames(c.credit).map(author).filter(Boolean);
  const [year, month] = c.accepted.split("-");
  return entry(`${KEY}-${c.key}`, [
    ["author", authors.length ? `{${authors.join(" and ")}}` : `{{${SITE.name}}}`],
    ["title", `{{${escape(c.title)}}}`],
    ["howpublished", `{${escape(`${SITE.name}: ${SITE.subtitle}`)}, contribution ${c.key} to Problem ${c.problem.number}}`],
    ["year", `{${year}}`],
    ["month", MONTHS[Number(month) - 1]],
    ["date", `{${c.accepted}}`],
    ["url", `{${origin}${permalinkPath(c.key)}}`],
    ["urldate", `{${today}}`],
    ["note", `{${escape(`${CONTRIBUTION_KIND_LABELS[c.kind].replace(/^./, (l) => l.toUpperCase())} on Problem ${c.problem.number} (${c.problem.title}); ${AI_USE_LABELS[c.aiUse]}`)}}`],
  ]);
}

/** The database as a whole, as one line of text. */
export function databaseCitation({ origin, today }: CiteContext): string {
  return `${SITE.name}: ${SITE.subtitle}, ${origin} (accessed ${longDate(today)})`;
}

/** The database as a whole: a living resource, so it is dated by the day it was consulted. */
export function databaseBibtex({ origin, today }: CiteContext): string {
  return entry(KEY, [
    ["author", `{{${SITE.name}}}`],
    ["title", `{{${escape(`${SITE.name}: ${SITE.subtitle}`)}}}`],
    ["howpublished", `{Online database}`],
    ["year", `{${today.slice(0, 4)}}`],
    ["url", `{${origin}}`],
    ["urldate", `{${today}}`],
  ]);
}

/** The companion paper's entry, from SITE.paper. What is not known yet stays an empty field, to be filled in there. */
export function paperBibtex(): string {
  const { title, year, url, bibtex: b } = SITE.paper;
  return entry(
    b.key,
    [
      ["author", `{${b.author}}`],
      ["title", `{{${escape(title)}}}`],
      ["journal", `{${b.journal}}`],
      ["volume", `{${b.volume}}`],
      ["pages", `{${b.pages}}`],
      ["year", `{${year}}`],
      ["doi", `{${b.doi}}`],
      ["eprint", `{${b.eprint}}`],
      ["archivePrefix", "{arXiv}"],
      ["url", `{${url}}`],
    ],
    "article",
  );
}

/** The site's public address: BETTER_AUTH_URL, which the sign-in links depend on too. Server only. */
export function siteOrigin(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Today in the visitor's time zone (or the server's), as "YYYY-MM-DD". Reads the clock. */
export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
