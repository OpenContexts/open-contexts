import type { Metadata } from "next";
import Link from "next/link";
import { ProposalForm } from "@/components/submissions/proposal-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Propose a new problem", robots: { index: false } };

export default async function NewProblemPage() {
  const user = await requireUser("/contribute/new-problem");
  return (
    <SubmissionPage
      back={{ href: "/contribute", label: "Contribute" }}
      title="Propose a new problem"
      intro={
        <p>
          Describe an open problem the way it would appear on the site: a precise statement in a box, followed by
          its background, relevance, significance and feasibility. Use the <em>Preview</em> tab to check the
          formatting and the mathematics. Proposals are checked against the{" "}
          <Link href="/contribute#curation-criteria" className="text-brand hover:underline">
            curation criteria
          </Link>
          . The list of the case study is fixed, so new problems are kept as additional problems.
        </p>
      }
    >
      <ProposalForm defaultPosedBy={user.name} />
    </SubmissionPage>
  );
}
