import type { Metadata } from "next";
import Link from "next/link";
import { ProblemList } from "@/components/problems/problem-list";
import { AppleIcon, PageTitle, SectionTitle } from "@/components/ui";
import { AREAS } from "@/lib/areas";
import { getProblems, type Problem } from "@/lib/data/problems";

export const metadata: Metadata = { title: "Research areas" };

export default async function AreasPage() {
  const problems = await getProblems();
  return (
    <>
      <PageTitle>Research areas</PageTitle>
      {AREAS.map((area) => (
        <section key={area.id} id={area.id}>
          <SectionTitle>
            <AppleIcon variant="gold" className="mr-1.5" />
            {area.numeral}. {area.title}
          </SectionTitle>
          <p className="mb-3 text-justify hyphens-auto">{area.summary}</p>
          <AreaProblems areaId={area.id} problems={problems.filter((p) => p.areas.some((a) => a === area.id))} />
        </section>
      ))}
    </>
  );
}

const SHOWN = 3;

/** The first few problems of an area, and a link to the filtered list when there are more. */
function AreaProblems({ areaId, problems }: { areaId: string; problems: Problem[] }) {
  return (
    <>
      <ProblemList problems={problems.slice(0, SHOWN)} empty="No problems in this area yet." />
      {problems.length > SHOWN && (
        <p className="mt-2.5 text-right">
          <Link href={`/problems?area=${areaId}`} className="text-brand hover:underline">
            See all {problems.length} problems in this area →
          </Link>
        </p>
      )}
    </>
  );
}
