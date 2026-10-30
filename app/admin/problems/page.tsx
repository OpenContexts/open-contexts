import type { Metadata } from "next";
import Link from "next/link";
import { ProblemActions } from "@/components/admin/problem-controls";
import { AdminButton, AdminButtonLink, AdminInput, Card, EmptyState, PageHeader, Pill, type PillTone, Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui";
import { getArea } from "@/lib/areas";
import { requireModerator } from "@/lib/auth/session";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import { getProblemActivity, type ProblemActivity } from "@/lib/data/moderation";
import { getProblems, searchProblems } from "@/lib/data/problems";
import { formatDate, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Problems" };

// Open is the normal state, so it stays grey; under revision and solved stand out.
const statusTone = { open: "neutral", "under-revision": "blue", solved: "green" } as const satisfies Record<ProblemStatus, PillTone>;

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
      <Problems searchParams={searchParams} />
    </>
  );
}

function Activity({ a }: { a?: ProblemActivity }) {
  if (!a) return <span className="text-zinc-300">—</span>;
  const parts = [a.comments && plural(a.comments, "comment"), a.contributions && plural(a.contributions, "result")].filter(Boolean);
  return (
    <span className="text-zinc-500">
      {parts.join(" · ") || "—"}
      {a.pending > 0 && (
        <Pill tone="amber" dot className="ml-2">
          {a.pending} pending
        </Pill>
      )}
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
          <Table>
            <THead>
              <tr>
                <Th className="w-14 text-right">No.</Th>
                <Th>Problem</Th>
                <Th>Status</Th>
                <Th>Activity</Th>
                <Th>Updated</Th>
                <Th className="w-12">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {problems.map((p) => (
                <Tr key={p.id}>
                  <Td className="text-right font-medium text-zinc-400 tabular-nums">{p.number}</Td>
                  <Td className="max-w-[28rem]">
                    <Link href={`/admin/problems/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      <span title={p.areas.map((a) => getArea(a)?.title ?? a).join(", ")}>Area {p.areas.map((a) => getArea(a)?.numeral ?? a).join(", ")}</span> · /problems/{p.slug}
                    </p>
                  </Td>
                  <Td>
                    <Pill tone={statusTone[p.status]} dot>
                      {PROBLEM_STATUS_LABELS[p.status].replace(/^./, (c) => c.toUpperCase())}
                    </Pill>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Activity a={activity.get(p.id)} />
                  </Td>
                  <Td className="whitespace-nowrap text-zinc-600">{formatDate(p.updated)}</Td>
                  <Td className="py-2 text-right">
                    <ProblemActions problem={{ id: p.id, number: p.number, title: p.title, slug: p.slug }} activity={activity.get(p.id)} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <footer className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
            {query ? `${problems.length} of ${all.length} problems` : `${all.length} problems`}
          </footer>
        </Card>
      ) : (
        <EmptyState title={query ? `No problems match “${query}”` : "No problems yet"} description={query ? undefined : "Add the first one with “New problem”."} />
      )}
    </>
  );
}
