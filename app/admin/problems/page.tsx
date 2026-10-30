import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProblemActions } from "@/components/admin/problem-controls";
import { AdminButton, AdminButtonLink, AdminInput, Card, EmptyState, PageHeader, Pill } from "@/components/admin/ui";
import { getArea } from "@/lib/areas";
import { requireModerator } from "@/lib/auth/session";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { getProblemActivity, type ProblemActivity } from "@/lib/data/moderation";
import { getProblems, searchProblems } from "@/lib/data/problems";
import { formatDate, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Problems" };

const statusTone = { open: "neutral", "under-revision": "amber", solved: "green" } as const satisfies Record<ProblemStatus, string>;

export default function ProblemsAdminPage({ searchParams }: PageProps<"/admin/problems">) {
  return (
    <>
      <PageHeader
        title="Problems"
        description="Everything published on the site. Edit a problem directly, or add and remove problems."
        actions={
          <AdminButtonLink href="/admin/problems/new" variant="primary">
            New problem
          </AdminButtonLink>
        }
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-zinc-100" />}>
        <Problems searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Activity({ a }: { a?: ProblemActivity }) {
  if (!a) return <span className="text-zinc-300">—</span>;
  const parts = [a.comments && plural(a.comments, "comment"), a.contributions && plural(a.contributions, "result"), a.links && plural(a.links, "link")].filter(Boolean);
  return (
    <span className="text-zinc-500">
      {parts.join(" · ") || "—"}
      {a.pending > 0 && <Pill tone="amber" className="ml-2">{a.pending} pending</Pill>}
    </span>
  );
}

async function Problems({ searchParams }: Pick<PageProps<"/admin/problems">, "searchParams">) {
  await requireModerator();
  const { q, deleted } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const [all, activity] = await Promise.all([getProblems(), getProblemActivity()]);
  const problems = searchProblems(all, query);

  return (
    <>
      {deleted && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-emerald-800 ring-1 ring-emerald-200 ring-inset">The problem has been deleted.</p>}
      <form action="/admin/problems" role="search" className="mb-4 flex justify-end gap-2">
        <AdminInput type="search" name="q" defaultValue={query} placeholder="Search problems" aria-label="Search problems" className="w-64" />
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {problems.length ? (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-100 text-xs text-zinc-500">
                <tr>
                  <th className="w-12 px-5 py-2.5 text-right font-medium">No.</th>
                  <th className="px-3 py-2.5 font-medium">Problem</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Activity</th>
                  <th className="px-3 py-2.5 font-medium">Updated</th>
                  <th className="w-12 px-3 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {problems.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-right text-zinc-500 tabular-nums">{p.number}</td>
                    <td className="max-w-96 px-3 py-3">
                      <Link href={`/admin/problems/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                        {p.title}
                      </Link>
                      <p className="truncate text-xs text-zinc-500">
                        {p.areas.map((a) => getArea(a)?.title ?? a).join(", ")} · /problems/{p.slug}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={statusTone[p.status]}>{PROBLEM_STATUS_LABELS[p.status]}</Pill>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Activity a={activity.get(p.id)} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-600">{formatDate(p.updated)}</td>
                    <td className="px-3 py-2 text-right">
                      <ProblemActions problem={{ id: p.id, number: p.number, title: p.title, slug: p.slug }} activity={activity.get(p.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="border-t border-zinc-100 px-5 py-3 text-zinc-500">
            {query ? `${problems.length} of ${all.length} problems` : `${all.length} problems`}
          </footer>
        </Card>
      ) : (
        <EmptyState title={query ? `No problems match “${query}”` : "No problems yet"} description={query ? undefined : "Add the first one with “New problem”."} />
      )}
    </>
  );
}
