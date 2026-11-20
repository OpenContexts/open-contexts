// How accepted results refer to each other: a verification or challenge names the result it is about, and that
// result counts and lists them. Also the mark of a result its authors withdrew. Server components.
import Link from "next/link";
import { MathText } from "@/components/markdown/math-text";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ContributionKind } from "@/lib/constants";
import type { LinkedResult } from "@/lib/data/community";
import { plural } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

const VERBS: Partial<Record<ContributionKind, string>> = { verification: "Verifies", challenge: "Challenges" };

/** "Verifies OpenContext 12.3: Title", for a verification or challenge whose result is public. */
export function TargetLine({ kind, target, className }: { kind: ContributionKind; target?: LinkedResult; className?: string }) {
  const verb = VERBS[kind];
  if (!verb || !target) return null;
  return (
    <p className={cn("text-sm text-ink-subtle", className)}>
      {verb}{" "}
      <Link href={permalinkPath(target.key)} className="text-brand hover:underline">
        <span className="tabular-nums">
          {SITE.name} {target.key}
        </span>
        : <MathText text={target.title} />
      </Link>
      {target.withdrawn && " (since withdrawn)"}
    </p>
  );
}

/** Of a result's verifications and challenges, those its authors have not withdrawn. */
const standing = (responses: LinkedResult[]) => responses.filter((r) => !r.withdrawn);

/** "2 verifications · 1 challenge", in green and red; nothing when there are none. */
export function ResponseCounts({ responses }: { responses: LinkedResult[] }) {
  const current = standing(responses);
  const verifications = current.filter((r) => r.kind === "verification").length;
  const challenges = current.filter((r) => r.kind === "challenge").length;
  if (!verifications && !challenges) return null;
  return (
    <>
      {verifications > 0 && <span className="font-sans text-xs font-bold text-success">✓ {plural(verifications, "verification")}</span>}
      {challenges > 0 && <span className="font-sans text-xs font-bold text-brand">✕ {plural(challenges, "challenge")}</span>}
    </>
  );
}

/** On a result's page: its verifications and challenges, oldest first, each linking to its own page. */
export function ResponseList({ responses }: { responses: LinkedResult[] }) {
  if (!responses.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-sans text-sm font-bold">Verifications and challenges</h2>
      <ul className="divide-y divide-rule rounded-md border border-rule">
        {responses.map((r) => (
          <li key={r.id} className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-4 py-2.5", r.withdrawn && "text-ink-muted")}>
            <KindTag look={contributionLook(r.kind)} />
            {r.withdrawn && <WithdrawnTag />}
            <Link href={permalinkPath(r.key)} className="min-w-0 font-bold text-ink hover:text-brand">
              <MathText text={r.title} />
            </Link>
            <span className="text-sm text-ink-subtle">
              by {r.credit} · {SITE.name} {r.key}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawnTag() {
  return <Tag tone="neutral">Withdrawn</Tag>;
}
