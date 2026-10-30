"use client";

// The filters of the problem list (status, area, search, sort) run in the browser over rows the
// server rendered once, so the page is part of the static build and a filter change needs no server
// round trip. Only a search asks the server, for the ids that match (searchProblemIds).
import Form from "next/form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Button, ChipLink, Input, Select, TabLink, Tabs } from "@/components/ui";
import { searchProblemIds } from "@/lib/actions/search";
import { AREAS, type AreaId } from "@/lib/areas";
import { PROBLEM_STATUSES, PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { StatusIcon } from "./status";

/** What filtering and sorting need to know about a problem; its row is rendered on the server. */
export type BrowserItem = { id: string; number: number; status: ProblemStatus; areas: AreaId[]; updated: string };

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

function readFilters(sp: URLSearchParams): Filters {
  const one = (name: string) => sp.get(name)?.trim() || undefined;
  return {
    status: PROBLEM_STATUSES.find((s) => s === one("status")),
    area: AREAS.find((a) => a.id === one("area"))?.id,
    q: one("q"),
    sort: one("sort") === "date" ? "date" : "number",
  };
}

type Props = { items: BrowserItem[]; rows: Record<string, ReactNode> };

/** Reads the filters from the URL. Wrap it in <Suspense> with `<ProblemBrowserView filters={{ sort: "number" }} />`. */
export function ProblemBrowser(props: Props) {
  const filters = readFilters(useSearchParams());
  const [found, setFound] = useState<{ q: string; ids: Set<string> }>();

  useEffect(() => {
    if (!filters.q) return;
    let current = true;
    const q = filters.q;
    searchProblemIds(q).then((ids) => current && setFound({ q, ids: new Set(ids) }));
    return () => {
      current = false;
    };
  }, [filters.q]);

  // While a search is on its way, the previous list stays (dimmed) instead of a loading message.
  const matches = filters.q ? (found?.q === filters.q ? found.ids : "pending") : undefined;
  return <ProblemBrowserView {...props} filters={filters} matches={matches} />;
}

export function ProblemBrowserView({ items, rows, filters, matches }: Props & { filters: Filters; matches?: Set<string> | "pending" }) {
  const router = useRouter();
  const { status, area, q, sort } = filters;
  const searching = matches === "pending";

  const base = items.filter((p) => (matches instanceof Set ? matches.has(p.id) : true) && (!area || p.areas.includes(area)));
  const list = (status ? base.filter((p) => p.status === status) : base).toSorted((a, b) =>
    sort === "date" ? b.updated.localeCompare(a.updated) : a.number - b.number,
  );

  return (
    <>
      <Form action="/problems" role="search" className="mt-4 flex flex-wrap gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        {area && <input type="hidden" name="area" value={area} />}
        {sort === "date" && <input type="hidden" name="sort" value={sort} />}
        <label htmlFor="q" className="sr-only">
          Search problems
        </label>
        <Input key={q} id="q" name="q" type="search" placeholder="Search problems" defaultValue={q} autoComplete="off" className="min-w-0 flex-[1_1_14rem]" />
        <Button type="submit">Search</Button>
        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <Select id="sort" value={sort} onChange={(e) => router.replace(href({ ...filters, sort: e.target.value as Filters["sort"] }), { scroll: false })}>
          <option value="number">By number</option>
          <option value="date">Recently updated</option>
        </Select>
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

      <div className="mt-2.5 mb-4 flex flex-wrap items-center gap-1.5 text-[0.95rem] text-ink-muted">
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
        <p className="mb-2 text-sm text-ink-muted" aria-live="polite">
          {searching ? `Searching for “${q}”…` : `${list.length} ${list.length === 1 ? "result" : "results"} for “${q}”.`}{" "}
          <Link href={href({ status, area, sort })} className="text-brand hover:underline">
            Clear search
          </Link>
        </p>
      )}

      {list.length ? (
        <ul aria-busy={searching} className={searching ? "border-b border-rule opacity-50" : "border-b border-rule"}>
          {list.map((p) => (
            <Fragment key={p.id}>{rows[p.id]}</Fragment>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-ink-muted">{q ? `No problems match “${q}”.` : "No problems in this selection yet."}</p>
      )}
    </>
  );
}
