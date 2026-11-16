import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionList } from "@/components/problems/version-list";
import { PageTitle } from "@/components/ui";
import { getCachedVersions } from "@/lib/data/permalinks";
import { getProblem, problemLabel } from "@/lib/data/problems";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]/versions">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  return problem ? { title: `Versions of ${problemLabel(problem)}` } : {};
}

/** Every version of the problem's text, each linked to its permanent page (lib/permalinks.ts). */
export default async function VersionsPage({ params }: PageProps<"/problems/[slug]/versions">) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const versions = await getCachedVersions(problem.id);

  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href={`/problems/${slug}`} className="text-brand hover:underline">
          ← Problem {problem.number}: {problem.title}
        </Link>
      </p>
      <PageTitle className="mt-5">Versions of Problem {problem.number}</PageTitle>
      <p className="mb-6">
        Every accepted change to the title, statement, text or references starts a new version; minor corrections,
        such as typos, are made to the current one. Each version keeps its own permanent link, so work that refers
        to an earlier statement can still be checked against it.
      </p>
      {versions.length ? <VersionList versions={versions} /> : <p className="text-ink-muted">No versions recorded yet.</p>}
    </>
  );
}
