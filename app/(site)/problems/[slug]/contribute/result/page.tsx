import type { Metadata } from "next";
import { ResultForm } from "@/components/submissions/result-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { loadContributionContext } from "../context";

export const metadata: Metadata = { title: "Submit a result", robots: { index: false } };

export default async function Page({ params }: PageProps<"/problems/[slug]/contribute/result">) {
  const { problem, user, back } = await loadContributionContext(params, "result");
  return (
    <SubmissionPage
      back={back}
      title="Submit a result"
      intro={
        <p>
          Record work on <em>{problem.title}</em>: a claimed solution, a partial or negative result, numerical
          evidence, or a check of someone else&apos;s work. Results are credited to the people you name, together
          with how much AI was involved.
        </p>
      }
    >
      <ResultForm problemSlug={problem.slug} references={problem.references} defaultCredit={user.name} />
    </SubmissionPage>
  );
}
