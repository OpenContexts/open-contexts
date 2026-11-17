import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { ProblemList } from "@/components/problems/problem-list";
import { PageTitle } from "@/components/ui";
import { getCandidateProblems } from "@/lib/data/problems";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Candidate problems",
  description: "Problems accepted by the moderators that are not yet part of the published list.",
};

/** Accepted problems outside the published list. Cached until a problem changes, like /problems. */
export default async function CandidatesPage() {
  "use cache";
  cacheLife("max");
  cacheTag("problems");

  const candidates = await getCandidateProblems();
  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href="/problems" className="text-brand hover:underline">
          ← All problems
        </Link>
      </p>
      <PageTitle className="mt-5">Candidate problems</PageTitle>
      <p className="mb-8 text-justify hyphens-auto max-sm:text-left">
        For the first cycle, {SITE.name} I, the{" "}
        <Link href="/problems" className="text-brand hover:underline">
          list of problems
        </Link>{" "}
        is fixed in advance. The problems below have been proposed and accepted by the moderators since, and are kept
        for consideration in the next cycle; the moderators may also admit some of them to the list earlier (see the{" "}
        <Link href="/guidelines#cycles" className="text-brand hover:underline">
          guidelines
        </Link>
        ). Until then they are open for comments and contributions like any other problem.
      </p>
      <ProblemList problems={candidates} empty="There are no candidate problems at the moment." />
    </>
  );
}
