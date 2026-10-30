import type { Metadata } from "next";
import { Suspense } from "react";
import { type BrowserItem, ProblemBrowser, ProblemBrowserView } from "@/components/problems/problem-browser";
import { ProblemRow } from "@/components/problems/problem-list";
import { PageTitle } from "@/components/ui";
import { getProblems } from "@/lib/data/problems";

export const metadata: Metadata = { title: "Problems" };

/**
 * Static: built from the cached problem list, and rebuilt only when a problem changes. Filtering happens
 * in the browser (see ProblemBrowser). Until the page is interactive it shows the full list, which is
 * what /problems without filters shows anyway.
 */
export default async function ProblemsPage() {
  const problems = await getProblems();
  const items: BrowserItem[] = problems.map(({ id, number, status, areas, updated }) => ({ id, number, status, areas, updated }));
  const rows = Object.fromEntries(problems.map((p) => [p.id, <ProblemRow key={p.id} problem={p} />]));
  return (
    <>
      <PageTitle>Problems</PageTitle>
      <Suspense fallback={<ProblemBrowserView items={items} rows={rows} filters={{ sort: "number" }} />}>
        <ProblemBrowser items={items} rows={rows} />
      </Suspense>
    </>
  );
}
