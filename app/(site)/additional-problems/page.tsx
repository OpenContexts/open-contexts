import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { ProblemList } from "@/components/problems/problem-list";
import { PageTitle } from "@/components/ui";
import { getAdditionalProblems } from "@/lib/data/problems";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Additional problems",
  description: "Problems accepted by the moderators that are not part of the published list.",
};

/** Accepted problems outside the published list. Cached until a problem changes, like /problems. */
export default async function AdditionalProblemsPage() {
  "use cache";
  cacheLife("max");
  cacheTag("problems");

  const additional = await getAdditionalProblems();
  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href="/problems" className="text-brand hover:underline">
          ← All problems
        </Link>
      </p>
      <PageTitle className="mt-5">Additional problems</PageTitle>
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
        ). They are open for comments and contributions like any other problem.
      </p>
      <ProblemList problems={additional} empty="There are no additional problems at the moment." />
    </>
  );
}
