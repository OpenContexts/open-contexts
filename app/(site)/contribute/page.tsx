import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FormattingGuide } from "@/components/markdown/formatting-guide";
import { ButtonLink, FramedBox, PageTitle, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Contribute" };

const STEPS = [
  { title: "Sign in", text: "under your own name, with the email address of your university or research institute or with GitHub." },
  { title: "Choose what to add", text: "to an existing problem, or propose a new one. Each kind of contribution has its own short form." },
  { title: "A moderator reviews it", text: "and accepts it, or explains what is missing. You can follow the status under My submissions." },
  { title: "It is published", text: "on the problem page, credited to the people you named." },
];

const CRITERIA = [
  {
    name: "Clarity",
    text: "The problem must be precisely stated, with fixed objects and assumptions, so that what counts as a solution is unambiguous and the problem can be readily prompted into an AI agent.",
  },
  { name: "Relevance", text: "The problem must be well-motivated within the existing literature and traceable to at least one of the program's long-term goals." },
  { name: "Significance", text: "The problem's resolution must meaningfully advance the long-term goal(s) to which the problem is traceable." },
  {
    name: "Feasibility",
    text: "The problem must be plausibly tackled with existing techniques and near-term AI assistance: not necessarily easy, but not so far beyond current methods that even formulating a strategy is out of reach.",
  },
];

const BEST_PRACTICES = [
  { name: "Prompt cautiously", text: "Do not feed other researchers' unpublished material shared privately, such as ideas on how to solve a certain problem, to commercial AI services without their consent." },
  { name: "Be honest", text: "Claim full understanding only if you can follow all the relevant arguments presented, explain why each step is needed, name its assumptions, and answer questions about it; declare partial understanding otherwise." },
  { name: "Avoid single-prompt outputs", text: "Even when a single prompt yields a promising solution, engage with the material in follow-up iterative prompting before submitting it." },
  { name: "Be polite", text: "Agents have no feelings; humans do. A digestion phase is public and every submission carries named humans, so direct polite criticism at the claim or passages, not at the involved researchers." },
  { name: "Avoid duplication", text: "Check whether a claimed solution already exists. If one does, do not rapidly prepare an AI-written revised version merely to reflect \"your own style\" and submit it; make an effort, instead, to ensure that distinct solutions offer distinct insights into the same problem."},
  { name: "Recognize effort", text: "When preparing an explanatory exposition of an independent manuscript, or any work that benefited from the exchanges shared in OpenContexts, acknowledge, and where relevant, cite the contributions you drew on."}
];

const PARTS: { name: string; text: ReactNode }[] = [
  { name: "Statement", text: "The precise question, shown in the red box. Fix the objects and assumptions, and make clear what counts as a solution." },
  { name: "Background", text: "What a reader needs to understand the statement, with references." },
  {
    name: "Relevance",
    text: (
      <>
        How the problem is motivated within the existing literature, and which of the{" "}
        <Link href="/agenda" className="text-brand hover:underline">
          research agenda
        </Link>{" "}
        it traces to.
      </>
    ),
  },
  { name: "Significance", text: "How its resolution would meaningfully advance that agenda." },
  { name: "Feasibility", text: "Why the problem can plausibly be tackled with existing techniques and near-term AI assistance, for instance known special cases or a possible line of attack." },
];

const WAYS = [
  { icon: "∴", title: "Submit a result", text: "solutions, partial and negative results, evidence, verifications, expositions." },
  { icon: "§", title: "Add a reference", text: "literature that belongs on the page." },
  { icon: "✎", title: "Suggest an edit", text: "corrections, better statements, recent progress." },
  { icon: "¶", title: "Discuss", text: "questions and remarks in the discussion below each problem." },
];

export default function ContributePage() {
  return (
    <>
      <PageTitle>Contribute</PageTitle>
      <p className="text-justify hyphens-auto max-sm:text-left">
        OpenContexts is written by its readers. You can add results and references to the existing problems,
        improve their statements, discuss them, propose new problems, or{" "}
        <Link href="/blog/new" className="text-brand hover:underline">
          write a post for the blog
        </Link>
        . Everything is reviewed by a moderator before it appears.
      </p>

      <SectionTitle>How it works</SectionTitle>
      <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-9 bg-surface flex-none items-center justify-center rounded-full border border-ink font-sans text-sm font-bold">{i + 1}</span>
            <p className="text-[0.98rem]">
              <strong>{step.title}</strong> {step.text}
            </p>
          </li>
        ))}
      </ol>

      <SectionTitle>Propose a new problem</SectionTitle>
      <p className="text-justify hyphens-auto max-sm:text-left">
        A problem is added to the list if it meets the four criteria below. They make a problem well-posed enough
        that an AI agent can understand unambiguously what is being asked (Clarity) and search the literature for
        prior attempts and established results (Relevance), for a problem whose resolution would advance the
        research program (Significance) and that is not obviously out of reach (Feasibility). Proposals are checked
        against these criteria, not heavily refereed. For the first cycle, OpenContexts I, the list of problems is
        fixed: new proposals are kept for consideration in the next cycle (see the{" "}
        <Link href="/guidelines#cycles" className="text-brand hover:underline">
          guidelines
        </Link>
        ).
      </p>
      <FramedBox title="Curation criteria" tone="gold" className="scroll-mt-6" id="curation-criteria">
        <dl className="space-y-3">
          {CRITERIA.map((c) => (
            <div key={c.name} className="text-justify hyphens-auto max-sm:text-left">
              <dt className="inline font-bold">({c.name})</dt> <dd className="inline">{c.text}</dd>
            </div>
          ))}
        </dl>
      </FramedBox>

      <h3 className="mt-8 mb-3 font-sans text-sm font-bold">How to write a problem</h3>
      <p className="mb-3 text-justify hyphens-auto max-sm:text-left">
        A problem has the parts below. The proposal form starts its text with the four section headings after the
        statement, so you only have to fill them in.
      </p>
      <dl className="mb-6 space-y-2">
        {PARTS.map((part) => (
          <div key={part.name} className="text-justify hyphens-auto max-sm:text-left">
            <dt className="inline font-bold">{part.name}.</dt> <dd className="inline">{part.text}</dd>
          </div>
        ))}
      </dl>
      <p className="text-center">
        <ButtonLink href="/contribute/new-problem">Propose a new problem</ButtonLink>
      </p>

      <SectionTitle>Contribute to an existing problem</SectionTitle>
      <p className="mb-4">
        Open a problem from the{" "}
        <Link href="/problems" className="text-brand hover:underline">
          list of problems
        </Link>{" "}
        and use its “Contribute to this problem” section. You can:
      </p>
      <ul className="mb-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {WAYS.map((w) => (
          <li key={w.title} className="flex gap-2.5">
            <span aria-hidden className="border-ink flex-none bg-surface border rounded-full flex items-center justify-center size-9 text-[1.1rem]">{w.icon}</span>
            <p className="text-[0.98rem]">
              <strong>{w.title}:</strong> {w.text}
            </p>
          </li>
        ))}
      </ul>

      <FramedBox title="Best practices" tone="gold" className="scroll-mt-6" id="best-practices">
        <dl className="space-y-3">
          {BEST_PRACTICES.map((c) => (
            <div key={c.name} className="text-justify hyphens-auto max-sm:text-left">
              <dt className="inline font-bold">({c.name})</dt> <dd className="inline">{c.text}</dd>
            </div>
          ))}
        </dl>
      </FramedBox>

      <SectionTitle id="formatting" className="scroll-mt-6">
        Formatting
      </SectionTitle>
      <p className="mb-6 text-justify hyphens-auto max-sm:text-left">
        Problems, results, blog posts and comments are written in Markdown, with LaTeX for math, and can cite the
        problem&apos;s (or post&apos;s) references. Each text field has a Preview tab to check how the text will look, and the ⓘ above it brings up
        this summary while you write.
      </p>
      <FormattingGuide />
    </>
  );
}