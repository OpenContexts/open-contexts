import { Pill, type PillTone } from "@/components/admin/ui";
import { contributionLook } from "@/components/problems/kind-tag";
import type { TagTone } from "@/components/ui";
import type { ContributionKind, SubmissionType } from "@/lib/constants";

// The public site's colours for each kind of contribution, in the dashboard's palette.
const toneOf: Record<TagTone, PillTone> = { neutral: "neutral", success: "green", info: "blue", warning: "amber", danger: "red" };

const TYPES: Record<Exclude<SubmissionType, "contribution">, { label: string; tone: PillTone }> = {
  comment: { label: "Comment", tone: "blue" },
  revision: { label: "Suggested edit", tone: "violet" },
  proposal: { label: "New problem", tone: "green" },
};

/** What a submission is, in colour: its kind for contributions, otherwise its type. */
export function TypePill({ type, kind }: { type: SubmissionType; kind?: ContributionKind }) {
  if (type === "contribution") {
    if (!kind) return null;
    const look = contributionLook(kind);
    return <Pill tone={toneOf[look.tone]}>{look.label}</Pill>;
  }
  const { label, tone } = TYPES[type];
  return <Pill tone={tone}>{label}</Pill>;
}
