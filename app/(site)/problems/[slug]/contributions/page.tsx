import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionItem } from "@/components/problems/contribution-cards";
import { VotesProvider } from "@/components/problems/votes";
import { PageTitle, TabLink, Tabs } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ContributionKind } from "@/lib/constants";
import { type ApprovedContribution, getCachedContributions } from "@/lib/data/community";
import { getProblem, problemLabel } from "@/lib/data/problems";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]/contributions">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  return problem ? { title: `Contributions to ${problemLabel(problem)}` } : {};
}

/** The tabs: everything, the results by what they do for the problem, and the suggested references. */
const GROUPS = [
  {
    id: "all",
    label: "All",
    kinds: ["claim", "partial", "negative", "evidence", "verification", "challenge", "reformulation", "decomposition", "exposition", "reference"],
  },
  { id: "solutions", label: "Claimed solutions", kinds: ["claim"] },
  { id: "partial", label: "Partial and negative results", kinds: ["partial", "negative"] },
  { id: "evidence", label: "Evidence", kinds: ["evidence"] },
  { id: "checks", label: "Verifications and challenges", kinds: ["verification", "challenge"] },
  { id: "restated", label: "Reformulations", kinds: ["reformulation", "decomposition"] },
  { id: "exposition", label: "Expositions", kinds: ["exposition"] },
  { id: "references", label: "Suggested references", kinds: ["reference"] },
] as const satisfies { id: string; label: string; kinds: ContributionKind[] }[];

type GroupId = (typeof GROUPS)[number]["id"];
type Sort = "new" | "votes";

const PER_PAGE = 20;

const isReference = (c: ApprovedContribution) => Number(c.kind === "reference");

/** For sorting by votes: best score first, and references, which are not voted on, below every result. */
const byVotes = (a: ApprovedContribution, b: ApprovedContribution) => isReference(a) - isReference(b) || b.votes.up - b.votes.down - (a.votes.up - a.votes.down);

/**
 * Every contribution to the problem, by kind, newest or best voted first, as on the problem page: results as cards
 * with their votes and newest comments, suggested references as slim cards among them.
 */
export default async function ContributionsPage({ params, searchParams }: PageProps<"/problems/[slug]/contributions">) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const query = await searchParams;
  const items = await getCachedContributions(problem.id);

  const group = GROUPS.find((g) => g.id === query.kind) ?? GROUPS[0];
  const sort: Sort = query.sort === "votes" && group.id !== "references" ? "votes" : "new";
  const inGroup = (g: (typeof GROUPS)[number]) => items.filter((c) => (g.kinds as readonly ContributionKind[]).includes(c.kind));
  // The queries return newest first; votes break ties by date. References get no votes and go last.
  const listed = sort === "votes" ? inGroup(group).toSorted(byVotes) : inGroup(group);
  const pages = Math.max(1, Math.ceil(listed.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(query.page) || 1));
  const shown = listed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const href = (next: { kind?: GroupId; sort?: Sort; page?: number }) => {
    const kind = next.kind ?? group.id;
    const params = new URLSearchParams({
      ...(kind !== "all" && { kind }),
      ...((next.sort ?? sort) === "votes" && kind !== "references" && { sort: "votes" }),
      ...(next.page && next.page > 1 && { page: String(next.page) }),
    });
    return params.size ? `?${params}` : `/problems/${slug}/contributions`;
  };

  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href={`/problems/${slug}`} className="text-brand hover:underline">
          ← Problem {problem.number}: {problem.title}
        </Link>
      </p>
      <PageTitle className="mt-5">Contributions to Problem {problem.number}</PageTitle>
      <p>
        Everything submitted on the problem and accepted by the moderators. Each result has its own page, with its
        permanent link, the full discussion and a citation; vote on the ones you find useful, or not.
      </p>

      <Tabs label="Kinds of contribution">
        {GROUPS.map((g) => {
          const n = inGroup(g).length;
          // Kinds nobody has contributed yet stay out of the way; the current tab always shows.
          return n > 0 || g.id === group.id || g.id === "all" ? (
            <TabLink key={g.id} href={href({ kind: g.id, page: 1 })} active={g.id === group.id} count={n}>
              {g.label}
            </TabLink>
          ) : null;
        })}
      </Tabs>
      {group.id !== "references" && listed.length > 1 && (
        <p className="mb-4 flex justify-end gap-3 font-sans text-xs">
          <span className="text-ink-subtle">Sort by</span>
          {(["new", "votes"] as const).map((s) => (
            <Link key={s} href={href({ sort: s, page: 1 })} aria-current={s === sort ? "true" : undefined} className={cn(s === sort ? "font-bold text-ink" : "text-brand hover:underline")}>
              {s === "new" ? "Newest" : "Most votes"}
            </Link>
          ))}
        </p>
      )}

      {shown.length ? (
        <VotesProvider problemId={problem.id}>
          <ol className="mt-4 space-y-4">
            {shown.map((c) => (
              <ContributionItem key={c.id} item={c} references={problem.references} />
            ))}
          </ol>
        </VotesProvider>
      ) : (
        <p className="mt-6 text-ink-muted">Nothing here yet.</p>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-between font-sans text-sm">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="text-brand hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-subtle">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className="text-brand hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
