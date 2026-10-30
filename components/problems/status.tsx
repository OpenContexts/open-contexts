import { AppleIcon, type AppleVariant, Badge, type BadgeTone } from "@/components/ui";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";

const appleFor: Record<ProblemStatus, AppleVariant> = {
  open: "red",
  "under-revision": "outline",
  solved: "grey",
};

const toneFor: Record<ProblemStatus, BadgeTone> = {
  open: "neutral",
  "under-revision": "info",
  solved: "success",
};

export function StatusIcon({ status, className }: { status: ProblemStatus; className?: string }) {
  return <AppleIcon variant={appleFor[status]} className={className} />;
}

export function StatusBadge({ status }: { status: ProblemStatus }) {
  return <Badge tone={toneFor[status]}>{PROBLEM_STATUS_LABELS[status]}</Badge>;
}
