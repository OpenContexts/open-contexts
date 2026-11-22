import type { Metadata } from "next";
import { mathAsPlainText } from "@/components/markdown/math-text";
import { ResultForm, type ResultTarget } from "@/components/submissions/result-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { CONTRIBUTION_KINDS, CONTRIBUTION_KIND_LABELS, type ContributionKind, type ProblemStatus } from "@/lib/constants";
import { getCachedContributions } from "@/lib/data/community";
import { SITE } from "@/lib/site";
import { loadContributionContext } from "../context";

export const metadata: Metadata = { title: "Submit a result", robots: { index: false } };

const INTROS: Record<ProblemStatus, string> = {
  open: "a claimed solution, a partial or negative result, numerical evidence, or a check of someone else's work",
  "under-revision":
    "above all a verification or challenge of the claimed solution, a replication or a clear account of it; an independent solution or other progress is welcome too, since the claim may still fail",
  solved: "a verification or challenge of the solution, a replication or formalization of it, or a clear account of it; further work, such as a generalization, is best proposed as a new problem",
};

export default async function Page({ params, searchParams }: PageProps<"/problems/[slug]/contribute/result">) {
  const { problem, user, back } = await loadContributionContext(params, "result");
  const query = await searchParams;
  // What a verification or challenge can be about: accepted results that are not withdrawn, the claimed solution
  // first, then independent solutions.
  const results = (await getCachedContributions(problem.id)).filter((c) => c.key && c.kind !== "reference" && !c.withdrawnAt);
  const rank = (k: ContributionKind) => (k === "claim" ? 2 : k === "independent" ? 1 : 0);
  const targets: ResultTarget[] = results
    .toSorted((a, b) => rank(b.kind) - rank(a.kind))
    .map((c) => ({ key: c.key!, label: `${SITE.name} ${c.key} · ${CONTRIBUTION_KIND_LABELS[c.kind].replace(/^./, (x) => x.toUpperCase())}: ${mathAsPlainText(c.title)} (${c.credit})` }));
  const kind = CONTRIBUTION_KINDS.find((k) => k === query.kind) as ContributionKind | undefined;
  const target = targets.find((t) => t.key === query.target)?.key;
  return (
    <SubmissionPage
      back={back}
      title="Submit a result"
      intro={
        <p>
          Record work on <em>{problem.title}</em>: {INTROS[problem.status]}. Results are credited to the people you
          name, together with how much AI was involved.
        </p>
      }
    >
      <ResultForm problemSlug={problem.slug} references={problem.references} defaultCredit={user.name} status={problem.status} targets={targets} initial={{ kind, target }} />
    </SubmissionPage>
  );
}
