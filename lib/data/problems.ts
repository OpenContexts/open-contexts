// The problems, read from the `problem` table: the published list and the additional problems (accepted, but kept
// for a later cycle). The list is cached; every change to a problem (admin editor, approved edits and proposals,
// publishing) invalidates it with `updateTag("problems")`.
import "server-only";
import { asc, eq } from "drizzle-orm";
import matter from "gray-matter";
import { cacheLife, cacheTag } from "next/cache";
import type { AgendaId } from "@/lib/agenda";
import type { ProblemStatus } from "@/lib/constants";
import { db, isDbConfigured } from "@/lib/db";
import { aoeDate } from "@/lib/format";
import { type HistoryEntry, problem, type Reference } from "@/lib/db/schema";
import { withKeys } from "@/lib/references";

export type { HistoryEntry, Reference };

export type Problem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  status: ProblemStatus;
  agenda: AgendaId[];
  tags: string[];
  posedBy: string[];
  /** "1976", "1976-11" or "1976-11-15". */
  posed: string;
  /** In the published list (/problems); false for an additional problem (/additional-problems). */
  published: boolean;
  /** Date the problem was published in the list, "YYYY-MM-DD"; for an additional problem, the date it was accepted. */
  listed: string;
  /** Date of the last change, "YYYY-MM-DD". */
  updated: string;
  statement: string;
  /** Markdown with `##` sections (Background, Relevance, Significance, …). */
  body: string;
  history: HistoryEntry[];
  /** Each with its `key`, so \cite{key} in the texts can be resolved. */
  references: (Reference & { key: string })[];
  /** Markdown, set by moderators; "" when there is none. */
  note: string;
  version: number;
};

/** The day of a moment, AoE, like every date the site shows. */
const isoDate = (d: Date) => aoeDate(d);

function toProblem(r: typeof problem.$inferSelect): Problem {
  return {
    id: r.id,
    number: r.number,
    slug: r.slug,
    title: r.title,
    status: r.status,
    agenda: r.agenda as AgendaId[],
    tags: r.tags,
    posedBy: r.posedBy,
    posed: r.posed,
    published: r.publishedAt !== null,
    listed: isoDate(r.publishedAt ?? r.createdAt),
    updated: isoDate(r.updatedAt),
    statement: r.statement,
    body: r.body,
    history: r.history,
    references: withKeys(r.references),
    note: r.note,
    version: r.version,
  };
}

/** All problems, published and additional, sorted by number. Cached until the "problems" tag is invalidated. */
export async function getProblems(): Promise<Problem[]> {
  "use cache";
  cacheLife("max");
  cacheTag("problems");
  if (!isDbConfigured()) return [];
  const rows = await db.select().from(problem).orderBy(asc(problem.number));
  return rows.map(toProblem);
}

/** The published list: what /problems, the home page, the agenda and the progress figures show. */
export async function getPublishedProblems(): Promise<Problem[]> {
  return (await getProblems()).filter((p) => p.published);
}

/** Accepted, but not (yet) in the published list. */
export async function getAdditionalProblems(): Promise<Problem[]> {
  return (await getProblems()).filter((p) => !p.published);
}

export async function getProblem(slug: string): Promise<Problem | undefined> {
  return (await getProblems()).find((p) => p.slug === slug);
}

export async function getProblemById(id: string): Promise<Problem | undefined> {
  return (await getProblems()).find((p) => p.id === id);
}

/** Uncached, for checks inside server actions. */
export async function readProblem(id: string): Promise<Problem | undefined> {
  const row = await db.query.problem.findFirst({ where: eq(problem.id, id) });
  return row && toProblem(row);
}

/** "Problem 7: The hierarchy problem" */
export const problemLabel = (p: Pick<Problem, "number" | "title">) => `Problem ${p.number}: ${p.title}`;

/** Date the current status has held since: the latest `status` entry, else the date posed. */
export function statusSince(p: Problem): string {
  const changes = p.history.filter((h) => h.kind === "status").map((h) => h.date);
  return changes.sort().at(-1) ?? p.posed;
}

/** Plain word search over title, statement, tags and body. Every word must match. */
export function searchProblems(problems: Problem[], query: string): Problem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return problems;
  return problems.filter((p) => {
    const haystack = [p.title, p.statement, p.body, ...p.tags, ...p.posedBy].join(" ").toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

/** The problem as a markdown file: YAML frontmatter with every field, then the body. */
export function problemToMarkdown(p: Problem): string {
  const history = p.history.map(({ status, ...h }) => (status ? { ...h, status } : h));
  const references = p.references.map(({ url, ...r }) => (url ? { ...r, url } : r));
  // lineWidth -1: keep each value on one line instead of folding long text, so the file diffs and edits well.
  const yaml = { lineWidth: -1 } as matter.GrayMatterOption<string, never>;
  return matter.stringify(`\n${p.body.trim()}\n`, {
    number: p.number,
    slug: p.slug,
    title: p.title,
    status: p.status,
    published: p.published,
    agenda: p.agenda,
    tags: p.tags,
    posedBy: p.posedBy,
    posed: p.posed,
    updated: p.updated,
    statement: p.statement.trim(),
    history,
    references,
    ...(p.note.trim() && { note: p.note.trim() }),
  }, yaml);
}
