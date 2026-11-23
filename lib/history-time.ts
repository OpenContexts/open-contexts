import type { HistoryEntry } from "@/lib/db/schema";

/**
 * When a history entry was recorded, as an ISO timestamp: its own time, or, for entries from before times were kept,
 * the time of what it links to when that falls on its date: the version it started, or the contribution it records
 * (accepted, or withdrawn for a withdrawal). Undefined for entries entered by hand.
 */
export function entryTime(
  h: HistoryEntry,
  linked: { version?: { created: Date }; contribution?: { reviewedAt: Date | null; withdrawnAt: Date | null } },
): string | undefined {
  if (h.at) return h.at;
  const c = linked.contribution;
  const candidates = [linked.version?.created, h.text.includes("withdrawn by its authors") ? c?.withdrawnAt : c?.reviewedAt];
  return candidates.find((d): d is Date => !!d && d.toISOString().slice(0, 10) === h.date)?.toISOString();
}
