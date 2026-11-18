import { ActionCard, ActionCardGrid } from "@/components/ui";
import { cn } from "@/lib/cn";

/** The ways to contribute to one problem. Each leads to its own short form. */
export function ContributeOptions({ slug }: { slug: string }) {
  const base = `/problems/${slug}/contribute`;
  return (
    <ActionCardGrid className="sm:grid-cols-1">
      <ActionCard href={`${base}/result`} icon="∴" title="Submit a result" description="A solution, partial or negative result, evidence or exposition." />
      <ActionCard href={`${base}/reference`} icon="§" title="Add a reference" description="A paper or resource that belongs on this page." />
      <ActionCard href={`${base}/edit`} icon="✎" title="Suggest an edit" description="Fix an error or improve the statement or text." />
    </ActionCardGrid>
  );
}

/** "Contribute to this problem": the ways to, in a grey box, under a problem's contributions and on their own page. */
export function ContributeBox({ slug, className }: { slug: string; className?: string }) {
  return (
    <section className={cn("mt-8 rounded border border-rule bg-surface px-5 pt-4 pb-3.5", className)}>
      <h3 className="mb-3 font-sans text-sm font-bold">Contribute to this problem</h3>
      <ContributeOptions slug={slug} />
      <p className="mt-2.5 text-sm text-ink-subtle">
        You need to be signed in. Every contribution is reviewed by a moderator before it appears, and is credited
        to the people you name.
      </p>
    </section>
  );
}
