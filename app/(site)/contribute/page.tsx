import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, PageTitle, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Contribute" };

const STEPS = [
  { title: "Sign in", text: "with the email address of your university or research institute." },
  { title: "Choose what to add", text: "to an existing problem, or propose a new one. Each kind of contribution has its own short form." },
  { title: "A moderator reviews it", text: "and accepts it, or explains what is missing. You can follow the status under My submissions." },
  { title: "It is published", text: "on the problem page, credited to the people you named." },
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
        OpenContext is written by its readers. You can add results and references to the existing problems,
        improve their statements, discuss them, or propose new problems. Everything
        is reviewed by a moderator before it appears.
      </p>

      <SectionTitle>How it works</SectionTitle>
      <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-7 flex-none items-center justify-center rounded-full border border-ink font-sans text-sm font-bold">{i + 1}</span>
            <p className="text-[0.98rem]">
              <strong>{step.title}</strong> {step.text}
            </p>
          </li>
        ))}
      </ol>

      <SectionTitle>Propose a new problem</SectionTitle>
      <p className="mb-4 text-justify hyphens-auto max-sm:text-left">
        A good problem is stated precisely enough that a skilled researcher could start working on it, is
        motivated by the literature, and would meaningfully advance its area if solved. See the{" "}
        <Link href="/guidelines" className="text-brand hover:underline">
          guidelines
        </Link>
        .
      </p>
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
            <span aria-hidden className="w-5 flex-none text-center text-[1.1rem]">{w.icon}</span>
            <p className="text-[0.98rem]">
              <strong>{w.title}:</strong> {w.text}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
