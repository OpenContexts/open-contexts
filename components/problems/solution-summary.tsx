// At the top of a problem page: its claimed solution and any independent solutions, each with how many
// verifications and challenges it has, so where the problem stands is clear before the text. Server component.
import Link from "next/link";
import { MathText } from "@/components/markdown/math-text";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { ResponseCounts } from "@/components/problems/result-links";
import { RESULT_KINDS_BY_STATUS, type ProblemStatus } from "@/lib/constants";
import type { ApprovedContribution } from "@/lib/data/community";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

/** The solutions that stand: accepted, not withdrawn, the claimed solution first, then the others, oldest first. */
export function standingSolutions(contributions: ApprovedContribution[]): ApprovedContribution[] {
  const rank = (c: ApprovedContribution) => (c.kind === "claim" ? 0 : 1);
  return contributions
    .filter((c) => (c.kind === "claim" || c.kind === "independent") && c.key && !c.withdrawnAt)
    .toSorted((a, b) => rank(a) - rank(b) || a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * One line per solution: its kind, title, who and how it has been checked, with links to verify or challenge it
 * while the status takes them; above them the verifications and challenges of all of them together. Nothing while
 * no solution stands.
 */
export function SolutionSummary({ contributions, slug, status }: { contributions: ApprovedContribution[]; slug: string; status: ProblemStatus }) {
  const solutions = standingSolutions(contributions);
  if (!solutions.length) return null;
  const responses = solutions.flatMap((s) => s.responses);
  const checkable = RESULT_KINDS_BY_STATUS[status].includes("verification");
  const respond = (kind: string, key: string) => `/problems/${slug}/contribute/result?kind=${kind}&target=${encodeURIComponent(key)}`;
  return (
    <section aria-label="Solutions" className="mb-10 rounded-md border border-gold bg-gold-tint/60">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-gold/60 px-4 py-2">
        <h2 className="font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">{solutions.length === 1 ? "Solution" : `${solutions.length} solutions`}</h2>
        <span className="ml-auto flex flex-wrap items-baseline gap-x-2.5">
          {responses.some((r) => !r.withdrawn) ? (
            <>
              {solutions.length > 1 && <span className="text-sm text-ink-subtle">in all</span>}
              <ResponseCounts responses={responses} />
            </>
          ) : (
            <span className="text-sm text-ink-subtle">Not yet verified or challenged</span>
          )}
        </span>
      </header>
      <ul className="divide-y divide-gold/40">
        {solutions.map((s) => (
          <li key={s.id} className="px-4 py-2.5">
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <KindTag look={contributionLook(s.kind)} className="relative -top-px" />
              <Link href={permalinkPath(s.key!)} className="min-w-0 font-bold text-ink hover:text-brand">
                <MathText text={s.title} />
              </Link>
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm text-ink-subtle">
              <span>
                by {s.credit} · <span className="tabular-nums">{SITE.name} {s.key}</span>
              </span>
              <ResponseCounts responses={s.responses} />
              {checkable && (
                <span className="ml-auto flex gap-x-3 font-sans text-xs font-bold">
                  <Link href={respond("verification", s.key!)} className="text-brand hover:underline">
                    Verify
                  </Link>
                  <Link href={respond("challenge", s.key!)} className="text-brand hover:underline">
                    Challenge
                  </Link>
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
