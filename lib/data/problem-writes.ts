// Helpers for code that writes to the `problem` table: the admin editor and moderation decisions.
// Callers check permissions and call updateTag("problems") afterwards.
import "server-only";
import { max, ne } from "drizzle-orm";
import { CONTRIBUTION_KIND_LABELS, type ContributionKind, PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { type HistoryEntry, permalink, problem, problemVersion } from "@/lib/db/schema";

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

/**
 * One more than the highest number ever given, so a deleted problem's number, and its permanent links
 * ("12", "12v3", "12.3"), are never given to another problem.
 */
export async function nextProblemNumber(): Promise<number> {
  const [problems, links, versions] = await db.batch([
    db.select({ n: max(problem.number) }).from(problem),
    db.select({ n: max(permalink.problemNumber) }).from(permalink),
    db.select({ n: max(problemVersion.problemNumber) }).from(problemVersion),
  ]);
  return Math.max(problems[0]?.n ?? 0, links[0]?.n ?? 0, versions[0]?.n ?? 0) + 1;
}

/**
 * The history entry for a saved change, if any: with a new status, one `status` entry that carries the summary
 * (or says what the status changed to); otherwise an `edit` entry with the summary. `version`: the version of the
 * text the change started, if it started one, which the entry links to.
 */
export function changeEntries({ summary, from, to, version }: { summary?: string; from: ProblemStatus; to: ProblemStatus; version?: number }): HistoryEntry[] {
  const date = today();
  const started = version && { version };
  if (from !== to) return [{ date, kind: "status", text: summary || `Status changed to ${PROBLEM_STATUS_LABELS[to]}.`, status: to, ...started }];
  return summary ? [{ date, kind: "edit", text: summary, ...started }] : [];
}

/**
 * The entry withdrawing an accepted result adds to its problem's history ("Claimed solution withdrawn by its
 * authors: …"), dated the day of the withdrawal and linked by the result's key like its acceptance.
 */
export function withdrawalEntry(row: { kind: ContributionKind; title: string; withdrawnAt: Date }, key: string): HistoryEntry {
  const label = CONTRIBUTION_KIND_LABELS[row.kind].replace(/^./, (c) => c.toUpperCase());
  return { date: row.withdrawnAt.toISOString().slice(0, 10), kind: "note", text: `${label} withdrawn by its authors: ${row.title}`, contribution: key };
}
