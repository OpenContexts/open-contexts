import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DeleteProblemButton, PublishButton } from "@/components/admin/problem-controls";
import { ProblemForm } from "@/components/admin/problem-form";
import { AdminButtonLink, PageHeader } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { getProblemActivity } from "@/lib/data/moderation";
import { getVersions } from "@/lib/data/permalinks";
import { readProblem } from "@/lib/data/problems";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit problem" };

const SAVED = { created: "The problem has been created.", updated: "Your changes have been saved." } as const;

export default async function EditProblemPage({ params, searchParams }: PageProps<"/admin/problems/[id]">) {
  await requireModerator();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  // Uncached: the editor must show exactly what is stored, including the current version.
  const [problem, activity, versions, { saved }] = await Promise.all([readProblem(id), getProblemActivity(), getVersions(id), searchParams]);
  if (!problem) notFound();
  // The public version (12v3), which only changes with the text; `problem.version` counts every save, and only
  // guards against overwriting someone else's change.
  const current = versions.at(-1);
  const pendingEdits = activity.get(id)?.pending ?? 0;
  const target = { id: problem.id, number: problem.number, title: problem.title, slug: problem.slug, published: problem.published };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/problems", label: "Problems" }}
        title={`Problem ${problem.number}: ${problem.title}`}
        description={
          <>
            {problem.published ? `Published in the list since ${formatDate(problem.listed)}` : "Candidate, not in the published list"}
            {current && (
              <>
                {" · "}
                <Link href={`/problems/${problem.slug}/versions`} target="_blank" className="underline decoration-zinc-300 hover:text-zinc-900" title="All versions, on the site">
                  Version {current.version}
                </Link>
              </>
            )}
            {` · last changed ${formatDate(problem.updated)}`}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <PublishButton problem={target} />
            <AdminButtonLink href={`/problems/${problem.slug}`} target="_blank">
              View on the site ↗
            </AdminButtonLink>
            <AdminButtonLink href={`/admin/problems/${problem.id}/download`} download={`${problem.slug}.md`} prefetch={false}>
              Download .md
            </AdminButtonLink>
            <DeleteProblemButton problem={target} activity={activity.get(id)} />
          </div>
        }
      />
      {saved === "created" || saved === "updated" ? (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-emerald-800 ring-1 ring-emerald-200 ring-inset">{SAVED[saved]}</p>
      ) : null}
      {pendingEdits > 0 && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-amber-900 ring-1 ring-amber-200 ring-inset">
          {pendingEdits} {pendingEdits === 1 ? "submission" : "submissions"} on this problem {pendingEdits === 1 ? "is" : "are"} waiting for review.{" "}
          <Link href="/admin" className="underline">
            Open the overview
          </Link>
        </p>
      )}
      {/* Keyed by version, so the form starts fresh from the stored values after every save. */}
      <ProblemForm
        key={problem.version}
        id={problem.id}
        number={problem.number}
        version={problem.version}
        initial={{
          title: problem.title,
          status: problem.status,
          agenda: problem.agenda,
          posed: problem.posed,
          posedBy: problem.posedBy.join(", "),
          tags: problem.tags.join(", "),
          statement: problem.statement,
          body: problem.body,
          references: problem.references,
          note: problem.note,
          history: problem.history,
        }}
      />
    </>
  );
}
