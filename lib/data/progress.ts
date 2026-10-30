// How the list's statuses changed over time, computed from each problem's listing date and its dated
// "status" history entries. Pure functions over the problem list; the progress page caches the result.
import type { ProblemStatus } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";

export type TimelineRow = { date: string; total: number } & Record<ProblemStatus, number>;

type StatusEvent = { date: string; problemId: string; from: ProblemStatus | null; to: ProblemStatus };

/** "2019" → "2019-01-01", "2019-07" → "2019-07-01", so partial dates compare and count as days. */
const fullDate = (date: string) => `${date}-01-01`.slice(0, 10);

/** Whole days from `a` to `b` (both "YYYY-MM-DD"). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * Every problem joins the list on the day it was published, with the status its history had reached by then
 * (status changes from before the site existed are history, not progress on the site). Later dated status
 * entries change it on their day; entries dated after `today` wait for their day. If the entries do not end
 * in the problem's current status (set by hand without an entry), the current status counts from the last update.
 */
function statusEvents(problems: Problem[], today: string): StatusEvent[] {
  const events: StatusEvent[] = [];
  for (const p of problems) {
    const changes = p.history
      .filter((h) => h.kind === "status" && h.status)
      .map((h) => ({ date: fullDate(h.date), to: h.status! }))
      .filter((h) => h.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    let status: ProblemStatus = "open";
    for (const c of changes) if (c.date <= p.listed) status = c.to;
    events.push({ date: p.listed, problemId: p.id, from: null, to: status });
    for (const c of changes) {
      if (c.date > p.listed && c.to !== status) {
        events.push({ date: c.date, problemId: p.id, from: status, to: c.to });
        status = c.to;
      }
    }
    if (status !== p.status) events.push({ date: p.updated > p.listed ? p.updated : p.listed, problemId: p.id, from: status, to: p.status });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** The counts at the end of every day on which something changed, from the first listing on. */
export function statusTimeline(problems: Problem[], today: string): TimelineRow[] {
  const counts: Record<ProblemStatus, number> = { open: 0, "under-revision": 0, solved: 0 };
  const rows: TimelineRow[] = [];
  for (const e of statusEvents(problems, today)) {
    if (e.from) counts[e.from]--;
    counts[e.to]++;
    const row = { date: e.date, ...counts, total: counts.open + counts["under-revision"] + counts.solved };
    if (rows.at(-1)?.date === e.date) rows[rows.length - 1] = row;
    else rows.push(row);
  }
  return rows;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = values.toSorted((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * Medians over the changes that happened while a problem was on the site: days from listing to its first
 * claimed solution (open → under revision), and from a claim to the problem being solved.
 */
export function paceFigures(problems: Problem[], today: string) {
  const events = statusEvents(problems, today);
  const toClaim: number[] = [];
  const toSolved: number[] = [];
  for (const p of problems) {
    const own = events.filter((e) => e.problemId === p.id && e.from);
    const claim = own.find((e) => e.to === "under-revision");
    if (claim) toClaim.push(daysBetween(p.listed, claim.date));
    const solved = own.find((e) => e.from === "under-revision" && e.to === "solved");
    const claimBefore = solved && own.findLast((e) => e.to === "under-revision" && e.date <= solved.date);
    if (solved && claimBefore) toSolved.push(daysBetween(claimBefore.date, solved.date));
  }
  return {
    toClaim: { median: median(toClaim), count: toClaim.length },
    toSolved: { median: median(toSolved), count: toSolved.length },
  };
}
