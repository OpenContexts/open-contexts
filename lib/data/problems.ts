// The published problems, read from the `problem` table. The list is cached; every change to a
// problem (admin editor, approved edits and proposals) invalidates it with `updateTag("problems")`.
import "server-only";
import { asc, eq } from "drizzle-orm";
import matter from "gray-matter";
import { cacheLife, cacheTag } from "next/cache";
import type { AreaId } from "@/lib/areas";
import type { ProblemStatus } from "@/lib/constants";
import { db, isDbConfigured } from "@/lib/db";
import { type HistoryEntry, problem, type Reference } from "@/lib/db/schema";

export type { HistoryEntry, Reference };

export type Problem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  status: ProblemStatus;
  areas: AreaId[];
  tags: string[];
  posedBy: string[];
  /** "1976", "1976-11" or "1976-11-15". */
  posed: string;
  /** Date the problem was published on the site, "YYYY-MM-DD". */
  listed: string;
  /** Date of the last change, "YYYY-MM-DD". */
  updated: string;
  statement: string;
  /** Markdown body (Background, Partial progress, Significance, …). */
  body: string;
  history: HistoryEntry[];
  references: Reference[];
  version: number;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function toProblem(r: typeof problem.$inferSelect): Problem {
  return {
    id: r.id,
    number: r.number,
    slug: r.slug,
    title: r.title,
    status: r.status,
    areas: r.areas as AreaId[],
    tags: r.tags,
    posedBy: r.posedBy,
    posed: r.posed,
    listed: isoDate(r.createdAt),
    updated: isoDate(r.updatedAt),
    statement: r.statement,
    body: r.body,
    history: r.history,
    references: r.references,
    version: r.version,
  };
}

/** All problems, sorted by number. Cached until the "problems" tag is invalidated. */
export async function getProblems(): Promise<Problem[]> {
  "use cache";
  cacheLife("max");
  cacheTag("problems");
  if (!isDbConfigured()) return [];
  const rows = await db.select().from(problem).orderBy(asc(problem.number));
  return rows.map(toProblem);
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
    areas: p.areas,
    tags: p.tags,
    posedBy: p.posedBy,
    posed: p.posed,
    updated: p.updated,
    statement: p.statement.trim(),
    history,
    references,
  }, yaml);
}
