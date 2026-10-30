import { AppleIcon, type AppleVariant, Tag, type TagTone } from "@/components/ui";
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

export function StatusIcon({ status, className }: { status: ProblemStatus; className?: string }) {
  return <AppleIcon variant={appleFor[status]} className={className} />;
}

export function StatusBadge({ status, className }: { status: ProblemStatus; className?: string }) {
  return (
    <Tag tone={toneFor[status]} className={className}>
      {PROBLEM_STATUS_LABELS[status]}
    </Tag>
  );
}
