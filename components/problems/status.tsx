import { AppleIcon, type AppleVariant, HourglassIcon, Tag, type TagTone } from "@/components/ui";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";

const appleFor: Record<ProblemStatus, AppleVariant> = {
  open: "red",
  "under-revision": "outline",
  solved: "grey",
};

// The same colours as the progress chart: red open, blue under revision, green solved.
const toneFor: Record<ProblemStatus, TagTone> = {
  open: "danger",
  "under-revision": "info",
  solved: "success",
};

/** An apple in the status's colour; an hourglass in the same colour for a `candidate` (not yet in the published list). */
export function StatusIcon({ status, candidate, className }: { status: ProblemStatus; candidate?: boolean; className?: string }) {
  const Icon = candidate ? HourglassIcon : AppleIcon;
  return <Icon variant={appleFor[status]} className={className} />;
}

export function StatusBadge({ status, className }: { status: ProblemStatus; className?: string }) {
  return (
    <Tag tone={toneFor[status]} className={className}>
      {PROBLEM_STATUS_LABELS[status]}
    </Tag>
  );
}
