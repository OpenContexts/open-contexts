import type { Metadata } from "next";
import { EditForm } from "@/components/submissions/edit-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { loadContributionContext } from "../context";

export const metadata: Metadata = { title: "Suggest an edit", robots: { index: false } };

export default async function Page({ params }: PageProps<"/problems/[slug]/contribute/edit">) {
  const { problem, user, back } = await loadContributionContext(params, "edit");
  const { slug, title, statement, body, version, references } = problem;
  return (
    <SubmissionPage
      back={back}
      title="Suggest an edit"
      intro={<p>Fix an error, sharpen the statement or add recent progress. Once accepted, your version replaces the current one, becomes a new version of the problem credited to the people you name, and the change is recorded in the problem&apos;s history. The status (open, under revision, solved) is set by the moderators; if you think it should change, say why in the discussion or submit the result that justifies it.</p>}
    >
      <EditForm problem={{ slug, title, statement, body, version, references }} defaultCredit={user.name} />
    </SubmissionPage>
  );
}
