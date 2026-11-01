import type { Metadata } from "next";
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
          its background. Use the <em>Preview</em> tab to check the formatting and the mathematics.
        </p>
      }
    >
      <ProposalForm defaultPosedBy={user.name} />
    </SubmissionPage>
  );
}
