import type { Metadata } from "next";
import { EditForm } from "@/components/submissions/edit-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { PROBLEM_STATUS_LABELS, STATEMENT_EDITABLE } from "@/lib/constants";
import { loadContributionContext } from "../context";

export const metadata: Metadata = { title: "Suggest an edit", robots: { index: false } };

export default async function Page({ params }: PageProps<"/problems/[slug]/contribute/edit">) {
  const { problem, user, back } = await loadContributionContext(params, "edit");
  const { slug, title, statement, body, version, references } = problem;
  // Once a solution is claimed or accepted, the statement it answers stays fixed (guidelines, IV).
  const statementLocked = STATEMENT_EDITABLE[problem.status]
    ? undefined
    : `The statement stays as it is while the problem is ${PROBLEM_STATUS_LABELS[problem.status]}, so that the solution is judged against the question it answers. If you think it is flawed, say why in the discussion or submit a challenge.`;
  return (
    <SubmissionPage
      back={back}
      title="Suggest an edit"
      intro={<p>Fix an error, sharpen the statement or add recent progress. Once accepted, your version replaces the current one, becomes a new version of the problem credited to the people you name, and the change is recorded in the problem&apos;s history. The status (open, under revision, solved) is set by the moderators; if you think it should change, say why in the discussion or submit the result that justifies it.</p>}
    >
      <EditForm problem={{ slug, title, statement, body, version, references }} defaultCredit={user.name} statementLocked={statementLocked} />
    </SubmissionPage>
  );
}
