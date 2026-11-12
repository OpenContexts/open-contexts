import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownContent } from "@/components/markdown/markdown";
import { ProblemList } from "@/components/problems/problem-list";
import { AppleIcon, PageTitle, SectionTitle } from "@/components/ui";
import { AGENDA } from "@/lib/agenda";
import { getPublishedProblems, type Problem } from "@/lib/data/problems";

export const metadata: Metadata = { title: "Research agenda" };

export default async function AgendaPage() {
  const problems = await getPublishedProblems();
  return (
    <>
      <PageTitle>Research agenda</PageTitle>
      {AGENDA.map((item) => (
        <section key={item.id} id={item.id}>
          <SectionTitle>
            <AppleIcon variant="gold" className="mr-1.5" />
            {item.numeral}. {item.title}
          </SectionTitle>
          <MarkdownContent source={item.description} className="mb-6" />
          <ItemProblems itemId={item.id} problems={problems.filter((p) => p.agenda.some((a) => a === item.id))} />
        </section>
      ))}
    </>
  );
}

const SHOWN = 3;

/** The first few problems of an agenda item, and a link to the filtered list when there are more. */
function ItemProblems({ itemId, problems }: { itemId: string; problems: Problem[] }) {
  return (
    <>
      <ProblemList problems={problems.slice(0, SHOWN)} empty="No problems for this agenda item yet." />
      {problems.length > SHOWN && (
        <p className="mt-2.5 text-right">
          <Link href={`/problems?agenda=${itemId}`} className="text-brand hover:underline">
            See all {problems.length} problems for this agenda item →
          </Link>
        </p>
      )}
    </>
  );
}
