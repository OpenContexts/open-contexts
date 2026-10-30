import { Tag, type TagTone } from "@/components/ui";
import type { ContributionKind, HistoryKind, ProblemStatus } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";

type Look = { label: string; tone: TagTone; strong?: boolean };

// Strong colours only where the outcome matters: a solution, a verification, a refutation.
const contributionLooks: Record<ContributionKind, Look> = {
  claim: { label: "Claimed solution", tone: "warning", strong: true },
  verification: { label: "Verification", tone: "success", strong: true },
  negative: { label: "Negative result", tone: "danger", strong: true },
  challenge: { label: "Challenge", tone: "danger", strong: true },
  partial: { label: "Partial result", tone: "success" },
  evidence: { label: "Evidence", tone: "warning" },
  reformulation: { label: "Reformulation", tone: "info" },
  decomposition: { label: "Decomposition", tone: "info" },
  exposition: { label: "Exposition", tone: "neutral" },
  question: { label: "Question", tone: "neutral" },
  reference: { label: "Reference", tone: "neutral" },
};

const statusLooks: Record<ProblemStatus, Look> = {
  solved: { label: "Solved", tone: "success", strong: true },
  "under-revision": { label: "Under revision", tone: "warning", strong: true },
  // A problem only goes back to open when a claimed solution did not hold up.
  open: { label: "Reopened", tone: "danger", strong: true },
};

const historyLooks: Record<Exclude<HistoryKind, "status">, Look> = {
  posed: { label: "Posed", tone: "danger" },
  advance: { label: "Advance", tone: "success" },
  note: { label: "Note", tone: "neutral" },
  edit: { label: "Edit", tone: "neutral" },
};

function KindTag({ look, className }: { look: Look; className?: string }) {
  return (
    <Tag tone={look.tone} strong={look.strong} className={className}>
      {look.label}
    </Tag>
  );
}

export function ContributionKindTag({ kind, className }: { kind: ContributionKind; className?: string }) {
  return <KindTag look={contributionLooks[kind]} className={className} />;
}

export function HistoryKindTag({ entry, className }: { entry: HistoryEntry; className?: string }) {
  const look = entry.kind === "status" ? (entry.status ? statusLooks[entry.status] : { label: "Status", tone: "neutral" as const, strong: true }) : historyLooks[entry.kind];
  return <KindTag look={look} className={className} />;
}
