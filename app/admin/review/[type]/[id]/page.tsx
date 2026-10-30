import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DecisionPanel } from "@/components/admin/decision-panel";
import { SubmissionContent } from "@/components/admin/submission-content";
import { TypePill } from "@/components/admin/type-pill";
import { BlockUserButton } from "@/components/admin/user-controls";
import { ActionPill, AdminButtonLink, Avatar, Card } from "@/components/admin/ui";
import { blockRefusal, isAdmin, requireModerator } from "@/lib/auth/session";
import { type Role, SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import { getProblems } from "@/lib/data/problems";
import { getDecisionsFor, getSubmission } from "@/lib/data/moderation";
import { formatDate, formatRelative } from "@/lib/format";

export default async function ReviewPage({ params }: PageProps<"/admin/review/[type]/[id]">) {
  const me = await requireModerator();
  const { type: rawType, id } = (await params) as { type: string; id: string };
  const type = SUBMISSION_TYPES.find((t) => t === rawType);
  if (!type || !z.uuid().safeParse(id).success) notFound();

  const [submission, problems, decisions] = await Promise.all([getSubmission(type, id), getProblems(), getDecisionsFor(type, id)]);
  if (!submission) notFound();
  const { row } = submission;
  const byId = new Map(problems.map((p) => [p.id, p]));
  const problemId = row.problemId;
  const problem = problemId ? byId.get(problemId) : undefined;

  const heading = problem ? `Problem ${problem.number}: ${problem.title}` : submission.type === "proposal" ? submission.row.title : "A deleted problem";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/admin/queue/${type}`} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
        ← {SUBMISSION_TYPE_LABELS[type]}
      </Link>

      {/* What it is and which problem it belongs to, with the ways to look at that problem. */}
      <header className="mt-4 mb-6">
        <TypePill type={type} kind={submission.type === "contribution" ? submission.row.kind : undefined} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-900">{heading}</h1>
          {problem && (
            <div className="flex gap-2">
              <AdminButtonLink href={`/problems/${problem.slug}`} target="_blank" size="sm">
                View on site ↗
              </AdminButtonLink>
              <AdminButtonLink href={`/admin/problems/${problem.id}`} size="sm">
                Editor
              </AdminButtonLink>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Avatar name={row.author.name} className="size-9" />
          <p className="min-w-0 flex-1 leading-tight">
            <span className="font-medium text-zinc-900">{row.author.name}</span> <span className="text-zinc-500">{row.author.email}</span>
            <span className="mt-0.5 block text-xs text-zinc-500" title={formatDate(row.createdAt)}>
              Submitted {formatRelative(row.createdAt)}
            </span>
          </p>
          {/* Moderators block regular users, admins also moderators; only admins unblock (see blockRefusal). */}
          {row.author.id && (
            <BlockUserButton
              user={{ id: row.author.id, name: row.author.name, email: row.author.email, role: (row.author.role ?? "user") as Role, banned: !!row.author.banned }}
              refusal={blockRefusal(me, { id: row.author.id, role: row.author.role })}
              canUnblock={isAdmin(me)}
            />
          )}
        </div>
      </header>

      <div className="space-y-6">
        <div className="border-y border-zinc-200 py-5">
          <DecisionPanel type={type} id={id} status={row.status} problemId={problem?.id} />
        </div>
        <SubmissionContent submission={submission} problems={byId} />
        {decisions.length > 0 && (
          <Card title="History">
            <ol className="space-y-3">
              {decisions.map((d) => (
                <li key={d.id} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <span className="w-24 flex-none">
                    <ActionPill action={d.action} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">
                      {d.moderator?.name ?? "deleted user"} · {formatRelative(d.createdAt)}
                    </p>
                    {d.note && <p className="mt-1 text-zinc-700">{d.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
