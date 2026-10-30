import { ActionCard, ActionCardGrid } from "@/components/ui";

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
