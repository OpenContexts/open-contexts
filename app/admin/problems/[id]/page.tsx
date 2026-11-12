import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DeleteProblemButton, PublishButton } from "@/components/admin/problem-controls";
import { ProblemForm } from "@/components/admin/problem-form";
import { AdminButtonLink, PageHeader } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { getProblemActivity } from "@/lib/data/moderation";
import { readProblem } from "@/lib/data/problems";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit problem" };

const SAVED = { created: "The problem has been created.", updated: "Your changes have been saved." } as const;

export default async function EditProblemPage({ params, searchParams }: PageProps<"/admin/problems/[id]">) {
  await requireModerator();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  // Uncached: the editor must show exactly what is stored, including the current version.
  const [problem, activity, { saved }] = await Promise.all([readProblem(id), getProblemActivity(), searchParams]);
  if (!problem) notFound();
  const pendingEdits = activity.get(id)?.pending ?? 0;
  const target = { id: problem.id, number: problem.number, title: problem.title, slug: problem.slug, published: problem.published };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/problems", label: "Problems" }}
        title={`Problem ${problem.number}: ${problem.title}`}
        description={`${problem.published ? `Published in the list since ${formatDate(problem.listed)}` : "Candidate, not in the published list"} · Version ${problem.version}, last changed ${formatDate(problem.updated)}`}
        actions={
          <div className="flex gap-2">
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
