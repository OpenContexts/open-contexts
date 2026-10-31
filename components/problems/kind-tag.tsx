import { Tag, type TagTone } from "@/components/ui";
import type { ContributionKind, HistoryKind, ProblemStatus } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";

export type KindLook = { label: string; tone: TagTone; strong?: boolean };

// Filled only where the outcome matters: a solution, a verification, a refutation, a change of status.
const contributionLooks: Record<ContributionKind, KindLook> = {
  claim: { label: "Claimed solution", tone: "warning", strong: true },
  verification: { label: "Verification", tone: "success", strong: true },
  negative: { label: "Negative result", tone: "danger", strong: true },
  challenge: { label: "Challenge", tone: "danger", strong: true },
  partial: { label: "Partial result", tone: "success" },
  evidence: { label: "Evidence", tone: "warning" },
  reformulation: { label: "Reformulation", tone: "info" },
  decomposition: { label: "Decomposition", tone: "info" },
  exposition: { label: "Exposition", tone: "neutral" },
  reference: { label: "Reference", tone: "neutral" },
};

const statusLooks: Record<ProblemStatus, KindLook> = {
  solved: { label: "Solved", tone: "success", strong: true },
  "under-revision": { label: "Under revision", tone: "info", strong: true },
  // A problem only goes back to open when a claimed solution did not hold up.
  open: { label: "Reopened", tone: "danger", strong: true },
};

const historyLooks: Record<Exclude<HistoryKind, "status">, KindLook> = {
  posed: { label: "Posed", tone: "info" },
  advance: { label: "Advance", tone: "success" },
  note: { label: "Note", tone: "neutral" },
  edit: { label: "Edit", tone: "neutral" },
};

export const contributionLook = (kind: ContributionKind) => contributionLooks[kind];

export function historyLook(entry: HistoryEntry): KindLook {
  if (entry.kind !== "status") return historyLooks[entry.kind];
  return entry.status ? statusLooks[entry.status] : { label: "Status", tone: "neutral", strong: true };
}

export function KindTag({ look, className }: { look: KindLook; className?: string }) {
  return (
    <Tag tone={look.tone} strong={look.strong} className={className}>
      {look.label}
    </Tag>
  );
}
