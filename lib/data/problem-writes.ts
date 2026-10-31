// Helpers for code that writes to the `problem` table: the admin editor and moderation decisions.
// Callers check permissions and call updateTag("problems") afterwards.
import "server-only";
import { max, ne } from "drizzle-orm";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { type HistoryEntry, problem } from "@/lib/db/schema";

export const today = () => new Date().toISOString().slice(0, 10);

/** "The Strong CP Problem!" → "the-strong-cp-problem" */
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** The slug itself if free, else slug-2, slug-3, … `exceptId` lets a problem keep its own slug. */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const rows = await db.select({ slug: problem.slug }).from(problem).where(exceptId ? ne(problem.id, exceptId) : undefined);
  const taken = new Set(rows.map((r) => r.slug));
  const start = base || "problem";
  let slug = start;
  for (let i = 2; taken.has(slug); i++) slug = `${start}-${i}`;
  return slug;
}

export async function nextProblemNumber(): Promise<number> {
  const [row] = await db.select({ n: max(problem.number) }).from(problem);
  return (row?.n ?? 0) + 1;
}

/**
 * The history entry for a saved change, if any: with a new status, one `status` entry that carries the summary
 * (or says what the status changed to); otherwise an `edit` entry with the summary.
 */
export function changeEntries({ summary, from, to }: { summary?: string; from: ProblemStatus; to: ProblemStatus }): HistoryEntry[] {
  const date = today();
  if (from !== to) return [{ date, kind: "status", text: summary || `Status changed to ${PROBLEM_STATUS_LABELS[to]}.`, status: to }];
  return summary ? [{ date, kind: "edit", text: summary }] : [];
}
