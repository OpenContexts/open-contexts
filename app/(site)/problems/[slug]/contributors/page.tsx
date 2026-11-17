import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contributionLook, type KindLook, KindTag } from "@/components/problems/kind-tag";
import { PageTitle } from "@/components/ui";
import { CONTRIBUTION_KIND_LABELS } from "@/lib/constants";
import { type Contributor, getContributors, type Role } from "@/lib/data/contributors";
import { getProblem, problemLabel } from "@/lib/data/problems";
import { formatDate, plural } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]/contributors">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  return problem ? { title: `Contributors to ${problemLabel(problem)}` } : {};
}

/** Everyone who contributed to the problem (lib/data/contributors.ts), each with what they did. */
export default async function ContributorsPage({ params }: PageProps<"/problems/[slug]/contributors">) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const contributors = await getContributors(problem.id);

  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href={`/problems/${slug}`} className="text-brand hover:underline">
          ← Problem {problem.number}: {problem.title}
        </Link>
      </p>
      <PageTitle className="mt-5">Contributors to Problem {problem.number}</PageTitle>
      <p className="mb-6">
        Everyone who posed or proposed the problem, edited its text, or added a result or a reference, in the order
        they first contributed, as credited when the moderators accepted their work. Comments are part of the
        discussion and not listed here.
      </p>
      {contributors.length ? (
        <ol className="space-y-4">
          {contributors.map((c) => (
            <ContributorCard key={c.name} contributor={c} />
          ))}
        </ol>
      ) : (
        <p className="text-ink-muted">No contributors recorded yet.</p>
      )}
    </>
  );
}

// The tags of the roles that are not contributions, in the colours of the same entries in the problem's history.
const ROLE_LOOKS: Record<Exclude<Role["kind"], "result" | "reference">, KindLook> = {
  posed: { label: "Posed", tone: "info" },
  proposed: { label: "Proposed", tone: "neutral" },
  edit: { label: "Edit", tone: "neutral" },
};

const roleLook = (r: Role): KindLook => (r.kind === "result" ? contributionLook(r.contributionKind) : r.kind === "reference" ? contributionLook("reference") : ROLE_LOOKS[r.kind]);

/**
 * One person, as a card like the contributions on the problem page: the name along the top, then one row for
 * each thing they did, with its tag, what it was and when.
 */
function ContributorCard({ contributor: c }: { contributor: Contributor }) {
  return (
    <li className="overflow-hidden rounded-md border border-rule bg-paper">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule bg-surface px-4 py-2.5">
        <h2 className="text-[1.05rem] font-bold">{c.name}</h2>
        <span className="text-sm text-ink-subtle">{plural(c.roles.length, "contribution")}</span>
      </div>
      <ul className="divide-y divide-rule">
        {c.roles.map((r, i) => (
          <li key={i} className="grid grid-cols-[8.75rem_minmax(0,1fr)_auto] items-baseline gap-x-4 px-4 py-2.5 max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-y-1.5">
            <span className="max-sm:col-span-full">
              <KindTag look={roleLook(r)} />
            </span>
            <span className="min-w-0 text-[0.98rem]">
              <RoleText role={r} />
            </span>
            <span className="text-sm text-ink-subtle tabular-nums">{r.kind === "posed" ? r.date.getUTCFullYear() : formatDate(r.date)}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

/** What the person did, next to its tag. */
function RoleText({ role: r }: { role: Role }) {
  switch (r.kind) {
    case "posed":
      return <>Posed the problem</>;
    case "proposed":
      return <>Proposed it for the site</>;
    case "edit":
      return (
        <>
          <Link href={permalinkPath(r.key)} className="text-brand tabular-nums hover:underline">
            Version {r.version}
          </Link>
          {r.summary && <span className="text-ink-muted">: {r.summary}</span>}
        </>
      );
    case "result":
      return r.key ? (
        <Link href={permalinkPath(r.key)} className="text-brand hover:underline" title={CONTRIBUTION_KIND_LABELS[r.contributionKind]}>
          {r.title}
        </Link>
      ) : (
        <>{r.title}</>
      );
    case "reference":
      return <>{r.title}</>;
    default:
      throw new Error(`Unknown role: ${r satisfies never}`);
  }
}
