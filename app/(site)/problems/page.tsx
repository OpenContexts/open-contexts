import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Form from "next/form";
import Link from "next/link";
import { ProblemList } from "@/components/problems/problem-list";
import { SortSelect } from "@/components/problems/sort-select";
import { StatusIcon } from "@/components/problems/status";
import { Button, ChipLink, Input, PageTitle, TabLink, Tabs } from "@/components/ui";
import { AREAS, type AreaId } from "@/lib/areas";
import { PROBLEM_STATUSES, PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { getProblems, searchProblems } from "@/lib/data/problems";

export const metadata: Metadata = { title: "Problems" };

type Filters = { status?: ProblemStatus; area?: AreaId; q?: string; sort: "number" | "date" };

function href({ status, area, q, sort }: Partial<Filters>) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (area) params.set("area", area);
  if (q) params.set("q", q);
  if (sort === "date") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/problems?${qs}` : "/problems";
}

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (name: string) => [sp[name]].flat()[0]?.trim() || undefined;
  return {
    status: PROBLEM_STATUSES.find((s) => s === one("status")),
    area: AREAS.find((a) => a.id === one("area"))?.id,
    q: one("q")?.slice(0, 200),
    sort: one("sort") === "date" ? "date" : "number",
  };
}

/** Filtered and sorted on the server. Each combination of filters is rendered once and cached until a problem changes. */
export default async function ProblemsPage({ searchParams }: PageProps<"/problems">) {
  const { status, area, q, sort } = readFilters(await searchParams);
  return (
    <>
      <PageTitle>Problems</PageTitle>
      <ProblemResults status={status} area={area} q={q} sort={sort} />
    </>
  );
}

async function ProblemResults(filters: Filters) {
  "use cache";
  cacheLife("max");
  cacheTag("problems");

  const { status, area, q, sort } = filters;
  const base = searchProblems(await getProblems(), q ?? "").filter((p) => !area || p.areas.includes(area));
  const list = (status ? base.filter((p) => p.status === status) : base).toSorted((a, b) =>
    sort === "date" ? b.updated.localeCompare(a.updated) : a.number - b.number,
  );

  return (
    <>
      <Form action="/problems" role="search" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {area && <input type="hidden" name="area" value={area} />}
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
        <TabLink href={href({ area, q, sort })} active={!status} count={base.length}>
          All
        </TabLink>
        {PROBLEM_STATUSES.map((s) => (
          <TabLink key={s} href={href({ status: s, area, q, sort })} active={status === s} count={base.filter((p) => p.status === s).length}>
            <StatusIcon status={s} />
            <span className="capitalize">{PROBLEM_STATUS_LABELS[s]}</span>
          </TabLink>
        ))}
      </Tabs>

      <div className="mt-3.5 mb-7 flex flex-wrap items-center gap-1.5 text-[0.95rem] text-ink-muted">
        <span>Area:</span>
        {AREAS.map((a) => (
          <ChipLink key={a.id} shape="square" active={area === a.id} title={a.title} href={href({ status, area: area === a.id ? undefined : a.id, q, sort })}>
            {a.numeral}
          </ChipLink>
        ))}
        {area && (
          <Link href={href({ status, q, sort })} className="text-sm text-brand hover:underline">
            clear
          </Link>
        )}
      </div>

      {q && (
        <p className="mb-2 text-sm text-ink-muted">
          {list.length} {list.length === 1 ? "result" : "results"} for “{q}”.{" "}
          <Link href={href({ status, area, sort })} className="text-brand hover:underline">
            Clear search
          </Link>
        </p>
      )}

      <ProblemList problems={list} empty={q ? `No problems match “${q}”.` : "No problems in this selection yet."} />
    </>
  );
}
