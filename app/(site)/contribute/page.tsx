import type { Metadata } from "next";
import Link from "next/link";
import { BEST_PRACTICES, CRITERIA } from "@/components/explainers/content";
import { Disclosure } from "@/components/explainers/disclosure";
import { Steps, Tiles } from "@/components/explainers/tiles";
import { FormattingGuide } from "@/components/markdown/formatting-guide";
import { ActionCard, ActionCardGrid, ButtonLink, FramedBox, PageTitle, SectionTitle } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contribute" };

const STEPS = [
  { title: "Sign in", text: "under your own name: institutional email, ORCID or GitHub." },
  { title: "Submit", text: "with a short form for each kind of contribution." },
  { title: "Light review", text: "A moderator accepts it, or explains what is missing." },
  { title: "Published", text: "credited to the people you named, with a permanent link." },
];

/** The parts of a problem, as the proposal form lays them out. */
const PARTS = [
  { name: "Statement", text: "The precise question, with what counts as a solution." },
  { name: "Background", text: "What a reader needs, with references." },
  { name: "Relevance", text: "Its motivation, and the goal it traces to." },
  { name: "Significance", text: "What solving it would advance." },
  { name: "Feasibility", text: "Why it is within reach: special cases, a line of attack." },
];

export default function ContributePage() {
  return (
    <>
      <PageTitle>Contribute</PageTitle>
      <p className="mx-auto max-w-140 text-center text-ink-muted">
        {SITE.name} is written by its readers. Every contribution is reviewed by a moderator and credited to the
        people you name.
      </p>

      <SectionTitle>What would you like to do?</SectionTitle>
      <ActionCardGrid>
        <ActionCard href="/problems" icon="∴" title="Submit a result" description="A solution, partial or negative result, evidence, verification or exposition, on a problem's page." />
        <ActionCard href="/problems" icon="§" title="Add a reference" description="Literature that belongs on a problem's page." />
        <ActionCard href="/problems" icon="✎" title="Suggest an edit" description="Correct or improve a problem's statement or text." />
        <ActionCard href="/problems" icon="¶" title="Discuss" description="Ask or remark in the discussion under each problem." />
        <ActionCard href="/contribute/new-problem" icon="?" title="Propose a new problem" description="Checked against the four curation criteria below." />
        <ActionCard href="/blog/new" icon="✍" title="Write a blog post" description="Overviews, the story behind a result, open directions." />
      </ActionCardGrid>
      <p className="mt-3 text-center text-sm text-ink-subtle">
        Results, references and edits start from the problem they belong to: open it and use{" "}
        <em>Contribute to this problem</em>.
      </p>

      <SectionTitle>How it works</SectionTitle>
      <Steps items={STEPS} />

      <SectionTitle>Propose a new problem</SectionTitle>
      <FramedBox title="Box I: Curation criteria" tone="gold" className="scroll-mt-6" id="curation-criteria">
        <Tiles items={CRITERIA} />
        <Disclosure label="The full wording">
          <dl className="space-y-2 text-[0.98rem]">
            {CRITERIA.map((c) => (
              <div key={c.title}>
                <dt className="inline font-bold">({c.title})</dt> <dd className="inline">{c.full}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      </FramedBox>

      <h3 className="mt-10 mb-4 text-center font-sans text-sm font-bold">A problem has five parts</h3>
      <ProblemAnatomy />
      <p className="mt-6 text-center">
        <ButtonLink href="/contribute/new-problem">Propose a new problem</ButtonLink>
      </p>
      <p className="mx-auto mt-3 max-w-140 text-center text-sm text-ink-subtle">
        The list of the first cycle is fixed. Accepted proposals become{" "}
        <Link href="/additional-problems" className="text-brand hover:underline">
          additional problems
        </Link>
        , open for contributions like any other (see the{" "}
        <Link href="/guidelines#cycles" className="text-brand hover:underline">
          guidelines
        </Link>
        ).
      </p>

      <SectionTitle>Best practices</SectionTitle>
      <FramedBox title="Box III: Best practices" tone="gold" className="scroll-mt-6" id="best-practices">
        <Tiles items={BEST_PRACTICES} />
      </FramedBox>

      <SectionTitle id="formatting" className="scroll-mt-6">
        Formatting
      </SectionTitle>
      <p className="text-center text-ink-muted">
        Markdown with LaTeX for math. Every text field has a Preview tab, and the ⓘ above it shows this guide.
      </p>
      <Disclosure label="Show the formatting guide" className="mt-4">
        <FormattingGuide />
      </Disclosure>
    </>
  );
}

/** A problem page in miniature: the boxed statement, then the four lettered sections the form starts with. */
function ProblemAnatomy() {
  const [statement, ...sections] = PARTS;
  return (
    <div className="mx-auto max-w-140">
      <div className="relative rounded-[7px] border-[1.5px] border-brand-dark bg-brand-tint px-4 pt-6 pb-3">
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[5px] border-[1.5px] border-brand-dark bg-brand-strong px-3 py-0.5 font-sans text-xs font-bold whitespace-nowrap text-white">
          {statement.name}
        </span>
        <p className="text-center text-[0.95rem] text-ink-muted">{statement.text}</p>
      </div>
      <ol className="mt-3 space-y-2">
        {sections.map((s, i) => (
          <li key={s.name} className="flex items-baseline gap-3 rounded border border-rule px-4 py-2 text-[0.95rem]">
            <strong className="w-28 flex-none">
              {String.fromCharCode(65 + i)}. {s.name}
            </strong>
            <span className="text-ink-muted">{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
