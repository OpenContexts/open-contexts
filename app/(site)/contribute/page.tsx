import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BEST_PRACTICES, CRITERIA } from "@/components/explainers/content";
import { Disclosure } from "@/components/explainers/disclosure";
import { Section } from "@/components/explainers/section";
import { Glyph, Steps, Tiles } from "@/components/explainers/tiles";
import { FormattingGuide } from "@/components/markdown/formatting-guide";
import { ButtonLink, FramedBox, PageTitle } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contribute" };

/** What can be added to a problem, from its page. */
const ON_A_PROBLEM = [
  { icon: "∴", title: "A result", text: "solution, partial or negative result, evidence, verification, challenge, exposition" },
  { icon: "§", title: "A reference", text: "literature that belongs on the page" },
  { icon: "✎", title: "An edit", text: "a correction or a better statement or text" },
  { icon: "¶", title: "A comment", text: "a question or remark in its discussion" },
];

const STEPS = [
  { title: "Sign in", text: "under your own name, with an institutional email or ORCID" },
  { title: "Submit", text: "a title, its type, how much AI was used, and who takes responsibility" },
  { title: "Light check", text: "relevant? fixed format? a named human? no duplicate? best practices?" },
  { title: "Published", text: "credited to the people you named, with a permanent link" },
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
        {SITE.name} is written by its readers. Unpolished and partial work is welcome; every contribution is credited
        to the people you name.
      </p>

      <Section title="What you can contribute">
        <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card title="On any problem" action={<ButtonLink href="/problems" variant="secondary">Choose a problem →</ButtonLink>}>
            <ul className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
              {ON_A_PROBLEM.map((w) => (
                <li key={w.title} className="flex gap-2.5 text-[0.95rem]/snug">
                  <Glyph className="size-7 text-[0.95rem]">{w.icon}</Glyph>
                  <span>
                    <strong className="block">{w.title}</strong>
                    <span className="text-ink-muted">{w.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-subtle">
              Open the problem and use <em>Contribute to this problem</em>, or its discussion.
            </p>
          </Card>
          <div className="grid gap-4">
            <Card title="A new problem" action={<ButtonLink href="/contribute/new-problem">Propose a problem</ButtonLink>}>
              <p className="text-[0.95rem] text-ink-muted">
                A well-posed question that meets the{" "}
                <a href="#propose" className="text-brand hover:underline">
                  four criteria
                </a>
                .
              </p>
            </Card>
            <Card title="A blog post" action={<ButtonLink href="/blog/new" variant="secondary">Write a post</ButtonLink>}>
              <p className="text-[0.95rem] text-ink-muted">Overviews, the story behind a result, open directions.</p>
            </Card>
          </div>
        </div>
      </Section>

      <Section id="how" title="How it works" intro="Every contribution is checked by a moderator before it appears.">
        <Steps items={STEPS} />
        <p className="mx-auto mt-6 max-w-160 text-center text-[0.95rem] text-ink-muted">
          As on a preprint server, moderators filter out only what is unrelated, predatory or unethical; they do not
          judge whether a solution is correct when accepting it. Follow your submissions, or withdraw one, under{" "}
          <em>My submissions</em>.
        </p>
      </Section>

      <Section id="propose" title="Proposing a problem" intro="A problem has five parts, and is admitted if it meets four criteria.">
        <span id="curation-criteria" />
        <div className="grid items-start gap-x-8 gap-y-10 md:grid-cols-2">
          <ProblemAnatomy />
          <FramedBox title="Box I: Curation criteria" tone="gold" className="mt-4 mb-0 max-md:mt-0">
            <Tiles items={CRITERIA} columns={2} className="sm:grid-cols-1" />
            <Disclosure label="The full wording" className="mb-0">
              <dl className="space-y-2 text-[0.95rem]">
                {CRITERIA.map((c) => (
                  <div key={c.title}>
                    <dt className="inline font-bold">({c.title})</dt> <dd className="inline">{c.full}</dd>
                  </div>
                ))}
              </dl>
            </Disclosure>
          </FramedBox>
        </div>
        <p className="mt-8 text-center">
          <ButtonLink href="/contribute/new-problem">Propose a new problem</ButtonLink>
        </p>
        <p className="mx-auto mt-3 max-w-140 text-center text-sm text-ink-subtle">
          The list of the first cycle is fixed: accepted proposals become{" "}
          <Link href="/additional-problems" className="text-brand hover:underline">
            additional problems
          </Link>
          , open for contributions like any other (see{" "}
          <Link href="/about#cycles" className="text-brand hover:underline">
            the cycles
          </Link>
          ).
        </p>
      </Section>

      <Section id="best-practices" title="Best practices">
        <FramedBox title="Box III: Best practices" tone="gold" className="mt-4 mb-0">
          <Tiles items={BEST_PRACTICES} />
        </FramedBox>
      </Section>

      <Section id="formatting" title="Formatting" intro="Markdown with LaTeX for math. Every text field has a Preview tab, and the ⓘ above it shows this guide.">
        <FormattingGuide />
      </Section>
    </>
  );
}

/** One kind of contribution, with the button that starts it at the bottom. */
function Card({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-md border border-rule-strong px-5 py-4">
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="flex-1">{children}</div>
      <p className="mt-4">{action}</p>
    </div>
  );
}

/** A problem page in miniature: the boxed statement, then the four lettered sections the form starts with. */
function ProblemAnatomy() {
  const [statement, ...sections] = PARTS;
  return (
    <div>
      <div className="relative mt-4 rounded-[7px] border-[1.5px] border-brand-dark bg-brand-tint px-4 pt-6 pb-3">
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[5px] border-[1.5px] border-brand-dark bg-brand-strong px-3 py-0.5 font-sans text-xs font-bold whitespace-nowrap text-white">
          {statement.name}
        </span>
        <p className="text-center text-[0.95rem] text-ink-muted">{statement.text}</p>
      </div>
      <dl className="mt-3 space-y-1.5 rounded-md border border-rule-strong py-2.5">
        {sections.map((s, i) => (
          <div key={s.name} className="flex items-baseline gap-3 px-4 text-[0.95rem]">
            <dt className="w-36 flex-none font-bold max-sm:w-32">
              {String.fromCharCode(65 + i)}. {s.name}
            </dt>
            <dd className="text-ink-muted">{s.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
