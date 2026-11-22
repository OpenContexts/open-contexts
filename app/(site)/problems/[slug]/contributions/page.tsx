import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionItem } from "@/components/problems/contribution-cards";
import { ProblemContext } from "@/components/problems/problem-context";
import { FilterSelect } from "@/components/problems/sort-select";
import { VotesProvider } from "@/components/problems/votes";
import { ContributeBox } from "@/components/submissions/contribute-options";
import { SignedInProvider } from "@/components/submissions/signed-in";
import { Button, PageTitle, SegmentLink, Segmented } from "@/components/ui";
import { isSignedIn } from "@/lib/auth/session";
import type { ContributionKind } from "@/lib/constants";
import { type ApprovedContribution, getCachedContributions } from "@/lib/data/community";
import { getProblem, problemLabel } from "@/lib/data/problems";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]/contributions">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  return problem ? { title: `Contributions to ${problemLabel(problem)}` } : {};
}

/** What the menu shows: everything, the results by what they do for the problem, and the suggested references. */
const GROUPS = [
  {
    id: "all",
    label: "All",
    kinds: ["claim", "independent", "partial", "negative", "evidence", "verification", "challenge", "reformulation", "decomposition", "exposition", "reference"],
  },
  { id: "solutions", label: "Solutions", kinds: ["claim", "independent"] },
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

  const action = `/problems/${slug}/contributions`;
  const href = (next: { kind?: GroupId; sort?: Sort; page?: number }) => {
    const kind = next.kind ?? group.id;
    const params = new URLSearchParams({
      ...(kind !== "all" && { kind }),
      ...((next.sort ?? sort) === "votes" && kind !== "references" && { sort: "votes" }),
      ...(next.page && next.page > 1 && { page: String(next.page) }),
    });
    return params.size ? `?${params}` : action;
  };

  return (
    <>
      <ProblemContext problem={problem} label="Contributions to" />
      <PageTitle className="mt-10">Contributions</PageTitle>
      <p>
        Everything submitted on the problem and accepted by the moderators. Each result has its own page, with its
        permanent link, the full discussion and a citation; vote on the ones you find useful, or not.
      </p>

      {/* What to show, from a menu, and in which order: one row above the list. */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-b border-rule pb-3">
        <Form action={action} className="flex items-center gap-2">
          {sort === "votes" && <input type="hidden" name="sort" value="votes" />}
          <label htmlFor="kind" className="sr-only">
            Show
          </label>
          <FilterSelect id="kind" name="kind" defaultValue={group.id} key={group.id}>
            {GROUPS.map((g) => {
              const n = inGroup(g).length;
              // Kinds nobody has contributed yet stay out of the way; the current one always shows.
              return n > 0 || g.id === group.id || g.id === "all" ? (
                <option key={g.id} value={g.id}>
                  {`${g.id === "all" ? "All contributions" : g.label} (${n})`}
                </option>
              ) : null;
            })}
          </FilterSelect>
          <noscript>
            <Button type="submit" variant="quiet" size="sm">
              Show
            </Button>
          </noscript>
        </Form>
        {group.id !== "references" && listed.length > 1 && (
          <Segmented label="Sort by">
            <SegmentLink href={href({ sort: "new", page: 1 })} active={sort === "new"}>
              Newest
            </SegmentLink>
            <SegmentLink href={href({ sort: "votes", page: 1 })} active={sort === "votes"}>
              Most votes
            </SegmentLink>
          </Segmented>
        )}
      </div>

      {shown.length ? (
        <SignedInProvider signedIn={isSignedIn()}>
          <VotesProvider problemId={problem.id}>
            <ol className="mt-5 space-y-4">
              {shown.map((c) => (
                <ContributionItem key={c.id} item={c} references={problem.references} />
              ))}
            </ol>
          </VotesProvider>
        </SignedInProvider>
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

      <ContributeBox slug={slug} status={problem.status} className="mt-12" />
    </>
  );
}
