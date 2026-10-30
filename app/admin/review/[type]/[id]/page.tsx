import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { SubmissionContent } from "@/components/admin/submission-content";
import { ActionPill, Card, DetailList, PageHeader, StatusPill } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS, SUBMISSION_TYPE_NOUNS } from "@/lib/constants";
import { getProblems } from "@/lib/data/problems";
import { getDecisionsFor, getSubmission } from "@/lib/data/moderation";
import { formatDate, formatRelative } from "@/lib/format";

export default function ReviewPage({ params }: PageProps<"/admin/review/[type]/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-zinc-100" />}>
      <Review params={params} />
    </Suspense>
  );
}

async function Review({ params }: Pick<PageProps<"/admin/review/[type]/[id]">, "params">) {
  await requireModerator();
  const { type: rawType, id } = (await params) as { type: string; id: string };
  const type = SUBMISSION_TYPES.find((t) => t === rawType);
  if (!type || !z.uuid().safeParse(id).success) notFound();

  const [submission, problems, decisions] = await Promise.all([getSubmission(type, id), getProblems(), getDecisionsFor(type, id)]);
  if (!submission) notFound();
  const { row } = submission;
  const byId = new Map(problems.map((p) => [p.id, p]));
  const problemId = "fromProblemId" in row ? row.fromProblemId : row.problemId;
  const problem = problemId ? byId.get(problemId) : undefined;

  return (
    <>
      <PageHeader
        back={{ href: `/admin/queue/${type}`, label: SUBMISSION_TYPE_LABELS[type] }}
        title={SUBMISSION_TYPE_NOUNS[type].replace(/^./, (c) => c.toUpperCase())}
        description={problem ? `on Problem ${problem.number}: ${problem.title}` : undefined}
        actions={<StatusPill status={row.status} />}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <SubmissionContent submission={submission} problems={byId} />
        <div className="space-y-4 lg:sticky lg:top-10">
          <DecisionPanel type={type} id={id} status={row.status} />
          <Card title="Details">
            <DetailList
              items={[
                { label: "Submitted by", value: <>{row.author.name}<br /><span className="text-zinc-500">{row.author.email}</span></> },
                { label: "Submitted", value: `${formatDate(row.createdAt)} (${formatRelative(row.createdAt)})` },
                ...(problem
                  ? [
                      {
                        label: "Problem",
                        value: (
                          <span className="flex flex-col gap-0.5">
                            <Link href={`/admin/problems/${problem.id}`} className="underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900">
                              Open in the editor
                            </Link>
                            <Link href={`/problems/${problem.slug}`} target="_blank" className="underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900">
                              View on the site ↗
                            </Link>
                          </span>
                        ),
                      },
                    ]
                  : []),
                ...(row.reviewNote ? [{ label: "Note to the author", value: row.reviewNote }] : []),
              ]}
            />
          </Card>
          {decisions.length > 0 && (
            <Card title="History">
              <ul className="space-y-2.5">
                {decisions.map((d) => (
                  <li key={d.id} className="flex items-start gap-2">
                    <ActionPill action={d.action} />
                    <span className="min-w-0 text-xs text-zinc-500">
                      {d.moderator?.name ?? "deleted user"}, {formatRelative(d.createdAt)}
                      {d.note && <span className="block text-zinc-700">“{d.note}”</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
