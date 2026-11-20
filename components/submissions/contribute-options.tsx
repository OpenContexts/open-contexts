import { ActionCard, ActionCardGrid } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProblemStatus } from "@/lib/constants";

/** What each form takes, by the problem's status (see RESULT_KINDS_BY_STATUS and STATEMENT_EDITABLE). */
const DESCRIPTIONS: Record<ProblemStatus, { result: string; edit: string }> = {
  open: { result: "A solution, partial or negative result, evidence or exposition.", edit: "Fix an error or improve the statement or text." },
  "under-revision": { result: "A verification or challenge of the claimed solution, an independent solution or other progress.", edit: "Fix an error or improve the text. The statement stays fixed for now." },
  solved: { result: "A verification, challenge, replication or exposition of the solution.", edit: "Fix an error or improve the text. The statement stays fixed." },
};

/** The ways to contribute to one problem, as its status allows. Each leads to its own short form. */
export function ContributeOptions({ slug, status }: { slug: string; status: ProblemStatus }) {
  const base = `/problems/${slug}/contribute`;
  return (
    <ActionCardGrid className="sm:grid-cols-1">
      <ActionCard href={`${base}/result`} icon="∴" title="Submit a result" description={DESCRIPTIONS[status].result} />
      <ActionCard href={`${base}/reference`} icon="§" title="Add a reference" description="A paper or resource that belongs on this page." />
      <ActionCard href={`${base}/edit`} icon="✎" title="Suggest an edit" description={DESCRIPTIONS[status].edit} />
    </ActionCardGrid>
  );
}

/** "Contribute to this problem": the ways to, in a grey box, under a problem's contributions and on their own page. */
export function ContributeBox({ slug, status, className }: { slug: string; status: ProblemStatus; className?: string }) {
  return (
    <section className={cn("mt-8 rounded border border-rule bg-surface px-5 pt-4 pb-3.5", className)}>
      <h3 className="mb-3 font-sans text-sm font-bold">Contribute to this problem</h3>
      <ContributeOptions slug={slug} status={status} />
      <p className="mt-2.5 text-sm text-ink-subtle">
        You need to be signed in. Every contribution is reviewed by a moderator before it appears, and is credited
        to the people you name.
      </p>
    </section>
  );
}
