import type { Metadata } from "next";
import Link from "next/link";
import { AgendaMap } from "@/components/explainers/agenda-map";
import { Disclosure } from "@/components/explainers/disclosure";
import { MarkdownContent } from "@/components/markdown/markdown";
import { ProblemList } from "@/components/problems/problem-list";
import { AppleIcon, Chip, ChipList, PageTitle, SectionTitle } from "@/components/ui";
import { AGENDA } from "@/lib/agenda";
import { getPublishedProblems, type Problem } from "@/lib/data/problems";

export const metadata: Metadata = { title: "Research agenda" };

/** The themes a goal's description sets out in bold ("**Generality.** …"), as labels. */
const themesOf = (description: string) => [...description.matchAll(/\*\*([^*]+?)\.\*\*/g)].map((m) => m[1]);

export default async function AgendaPage() {
  const problems = await getPublishedProblems();
  return (
    <>
      <PageTitle>Research agenda</PageTitle>
      <p className="mx-auto mb-4 max-w-140 text-center text-ink-muted">
        Three long-term goals organize the list, and every problem traces to at least one of them. They are provisional,
        and objections are welcome (see the{" "}
        <Link href="/guidelines#cycles" className="text-brand hover:underline">
          guidelines
        </Link>
        ).
      </p>
      <AgendaMap problems={problems} />

      {AGENDA.map((item) => {
        const themes = themesOf(item.description);
        return (
          <section key={item.id} id={item.id} className="scroll-mt-6">
            <SectionTitle>
              <AppleIcon variant="gold" className="mr-1.5" />
              {item.numeral}. {item.title}
            </SectionTitle>
            <p className="mx-auto max-w-160 text-center text-[1.02rem]">{item.summary}</p>
            {themes.length > 0 && (
              <ChipList className="mt-3 justify-center">
                {themes.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </ChipList>
            )}
            <Disclosure label="Read the full motivation" className="mx-auto max-w-160">
              <MarkdownContent source={item.description} />
            </Disclosure>
            <ItemProblems itemId={item.id} problems={problems.filter((p) => p.agenda.some((a) => a === item.id))} />
          </section>
        );
      })}
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
