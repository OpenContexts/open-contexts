// Citations: a BibTeX entry for each problem and for the database, in the format of the prototype.
// Plain functions of their inputs, so the browser can build them on a click with the day's date.
import { PROBLEM_STATUS_LABELS } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";
import { SITE } from "@/lib/site";

export type CitableProblem = Pick<Problem, "number" | "slug" | "title" | "posedBy" | "posed" | "status" | "updated">;

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

function entry(key: string, fields: [string, string | undefined][]): string {
  const lines = fields.filter(([, v]) => v !== undefined).map(([k, v]) => `  ${k.padEnd(12)} = ${v}`);
  return `@misc{${key},\n${lines.join(",\n")}\n}`;
}

/** The problem's entry. Its author and date are those of the problem as posed; with no posers recorded, the database is the author. */
export function problemBibtex(p: CitableProblem, { origin, today }: CiteContext): string {
  const authors = p.posedBy.map(author).filter(Boolean);
  const [year, month] = p.posed.split("-");
  return entry(`${KEY}-problem-${p.number}`, [
    ["author", authors.length ? `{${authors.join(" and ")}}` : `{{${SITE.name}}}`],
    ["title", `{{${escape(p.title)}}}`],
    ["howpublished", `{${escape(`${SITE.name}: ${SITE.subtitle}`)}, Problem ${p.number}}`],
    ["year", `{${year}}`],
    ["month", month ? MONTHS[Number(month) - 1] : undefined],
    ["date", `{${p.posed}}`],
    ["url", `{${origin}/problems/${p.slug}}`],
    ["urldate", `{${today}}`],
    ["note", `{Problem posed ${longDate(p.posed)}; status: ${PROBLEM_STATUS_LABELS[p.status]}, last updated ${longDate(p.updated)}}`],
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

/** The site's public address: BETTER_AUTH_URL, which the sign-in links depend on too. Server only. */
export function siteOrigin(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Today in the visitor's time zone (or the server's), as "YYYY-MM-DD". Reads the clock. */
export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
