import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContributeOptions } from "@/components/submissions/contribute-options";
import { ReviewNote } from "@/components/submissions/submission-page";
import { PageTitle } from "@/components/ui";
import { getProblem } from "@/lib/data/problems";

export default function ContributeToProblemPage({ params }: PageProps<"/problems/[slug]/contribute">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/problems/[slug]/contribute">["params"] }) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href={`/problems/${slug}`} className="text-brand hover:underline">
          ← Problem {problem.number}: {problem.title}
        </Link>
      </p>
      <PageTitle className="mt-5">Contribute to this problem</PageTitle>
      <p className="mb-5">
        What would you like to add? For questions and informal remarks, use the{" "}
        <Link href={`/problems/${slug}#discussion`} className="text-brand hover:underline">
          discussion
        </Link>{" "}
        at the bottom of the problem page.
      </p>
      <ContributeOptions slug={slug} />
      <ReviewNote />
    </>
  );
}
