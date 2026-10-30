import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, type BadgeTone, ButtonLink, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { type ModerationStatus, SUBMISSION_TYPE_NOUNS } from "@/lib/constants";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { getMySubmissions } from "@/lib/data/submissions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "My submissions", robots: { index: false } };

const STATUS: Record<ModerationStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "waiting for review", tone: "warning" },
  approved: { label: "published", tone: "success" },
  rejected: { label: "not accepted", tone: "danger" },
};

export default function MySubmissionsPage() {
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <Suspense fallback={<p className="text-center text-ink-subtle">Loading…</p>}>
        <Submissions />
      </Suspense>
    </>
  );
}

async function Submissions() {
  const user = await requireUser("/me");
  const problems = new Map((await getProblems()).map((p) => [p.id, p]));
  const items = await getMySubmissions(user.id, new Map([...problems].map(([id, p]) => [id, p.title])));

  if (!items.length) {
    return (
      <div className="text-center">
        <p className="mb-4 text-ink-muted">You have not submitted anything yet.</p>
        <ButtonLink href="/contribute">How to contribute</ButtonLink>
      </div>
    );
  }

  return (
    <ul className="border-b border-rule">
      {items.map((s) => (
        <li key={`${s.type}-${s.id}`} className="border-t border-rule py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="min-w-0">
              <span className="mr-2 font-mono text-xs text-ink-muted">{SUBMISSION_TYPE_NOUNS[s.type]}</span>
              {s.title}
            </p>
            <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-ink-subtle">
            {s.problemId && problems.has(s.problemId) && (
              <>
                <Link href={`/problems/${problems.get(s.problemId)!.slug}`} className="text-brand hover:underline">
                  {problemLabel(problems.get(s.problemId)!)}
                </Link>{" "}
                ·{" "}
              </>
            )}
            submitted {formatDate(s.createdAt)}
          </p>
          {s.reviewNote && (
            <p className="mt-1.5 border-l-2 border-rule-strong pl-3 text-[0.95rem] text-ink-muted">
              <span className="font-bold text-ink">Moderator&apos;s note:</span> {s.reviewNote}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
