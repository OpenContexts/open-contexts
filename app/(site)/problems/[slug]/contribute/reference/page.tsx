import type { Metadata } from "next";
import { Suspense } from "react";
import { ReferenceForm } from "@/components/submissions/reference-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { loadContributionContext } from "../context";

export const metadata: Metadata = { title: "Add a reference", robots: { index: false } };

export default function Page({ params }: PageProps<"/problems/[slug]/contribute/reference">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/problems/[slug]/contribute/reference">["params"] }) {
  const { problem, back } = await loadContributionContext(params, "reference");
  return (
    <SubmissionPage back={back} title="Add a reference" intro={<p>Point readers of <em>{problem.title}</em> to a paper, review or other resource that should be cited on the page.</p>}>
      <ReferenceForm problemSlug={problem.slug} />
    </SubmissionPage>
  );
}
