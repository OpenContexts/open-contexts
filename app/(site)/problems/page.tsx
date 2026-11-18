import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Form from "next/form";
import Link from "next/link";
import { ProblemList } from "@/components/problems/problem-list";
import { SortSelect } from "@/components/problems/sort-select";
import { StatusIcon } from "@/components/problems/status";
import { Button, ButtonLink, ChipLink, HourglassIcon, Input, PageTitle, TabLink, Tabs } from "@/components/ui";
import { AGENDA, type AgendaId } from "@/lib/agenda";
import { PROBLEM_STATUSES, PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { getCandidateProblems, getPublishedProblems, searchProblems } from "@/lib/data/problems";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Problems" };

type Filters = { status?: ProblemStatus; agenda?: AgendaId; q?: string; sort: "number" | "date" };

function href({ status, agenda, q, sort }: Partial<Filters>) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (agenda) params.set("agenda", agenda);
  if (q) params.set("q", q);
  if (sort === "date") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/problems?${qs}` : "/problems";
}

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (name: string) => [sp[name]].flat()[0]?.trim() || undefined;
  return {
    status: PROBLEM_STATUSES.find((s) => s === one("status")),
    agenda: AGENDA.find((a) => a.id === one("agenda"))?.id,
    q: one("q")?.slice(0, 200),
    sort: one("sort") === "date" ? "date" : "number",
  };
}

/** Filtered and sorted on the server. Each combination of filters is rendered once and cached until a problem changes. */
export default async function ProblemsPage({ searchParams }: PageProps<"/problems">) {
  const { status, agenda, q, sort } = readFilters(await searchParams);
  return (
    <>
      <PageTitle>Problems</PageTitle>
      <ProblemResults status={status} agenda={agenda} q={q} sort={sort} />
    </>
  );
}

async function ProblemResults(filters: Filters) {
  "use cache";
  cacheLife("max");
  cacheTag("problems");

  const { status, agenda, q, sort } = filters;
  const [published, candidates] = await Promise.all([getPublishedProblems(), getCandidateProblems()]);
  const base = searchProblems(published, q ?? "").filter((p) => !agenda || p.agenda.includes(agenda));
  const list = (status ? base.filter((p) => p.status === status) : base).toSorted((a, b) =>
    sort === "date" ? b.updated.localeCompare(a.updated) : a.number - b.number,
  );

  return (
    <>
      <Form action="/problems" role="search" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {agenda && <input type="hidden" name="agenda" value={agenda} />}
        <label htmlFor="q" className="sr-only">
          Search problems
        </label>
        <Input key={q} id="q" name="q" type="search" placeholder="Search problems" defaultValue={q} autoComplete="off" className="min-w-0 flex-[1_1_14rem]" />
        <Button type="submit">Search</Button>
        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <SortSelect id="sort" name="sort" defaultValue={sort}>
          <option value="number">By number</option>
          <option value="date">By last update</option>
        </SortSelect>
      </Form>

      <Tabs label="Filter by status">
        <TabLink href={href({ agenda, q, sort })} active={!status} count={base.length}>
          All
        </TabLink>
        {PROBLEM_STATUSES.map((s) => (
          <TabLink key={s} href={href({ status: s, agenda, q, sort })} active={status === s} count={base.filter((p) => p.status === s).length}>
            <StatusIcon status={s} />
            <span className="capitalize">{PROBLEM_STATUS_LABELS[s]}</span>
          </TabLink>
        ))}
      </Tabs>

      <div className="mt-3.5 mb-7 flex flex-wrap items-center gap-1.5 text-[0.95rem] text-ink-muted">
        <span>Agenda:</span>
        {AGENDA.map((a) => (
          <ChipLink key={a.id} shape="square" active={agenda === a.id} title={a.title} href={href({ status, agenda: agenda === a.id ? undefined : a.id, q, sort })}>
            {a.numeral}
          </ChipLink>
        ))}
        {agenda && (
          <Link href={href({ status, q, sort })} className="text-sm text-brand hover:underline">
            clear
          </Link>
        )}
      </div>

      {q && (
        <p className="mb-2 text-sm text-ink-muted">
          {list.length} {list.length === 1 ? "result" : "results"} for “{q}”.{" "}
          <Link href={href({ status, agenda, sort })} className="text-brand hover:underline">
            Clear search
          </Link>
        </p>
      )}

      <ProblemList problems={list} empty={q ? `No problems match “${q}”.` : "No problems in this selection yet."} />

      {candidates.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-[0.95rem] text-ink-muted">
            {plural(candidates.length, "further problem")} {candidates.length === 1 ? "has" : "have"} been accepted but {candidates.length === 1 ? "is" : "are"} not part of this list yet.
          </p>
          <ButtonLink href="/candidates" variant="secondary">
            <HourglassIcon variant="grey" />
            See the candidate problems →
          </ButtonLink>
        </div>
      )}
    </>
  );
}
