import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, PageTitle, Tag, type TagTone } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { CONTRIBUTION_KIND_LABELS, type ModerationStatus, SUBMISSION_TYPE_NOUNS } from "@/lib/constants";
import { getPosts } from "@/lib/data/blog";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { getMySubmissions, type MySubmission } from "@/lib/data/submissions";
import { formatDate } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "My submissions", robots: { index: false } };

// Same colours as everywhere else: gold waits, green is published, red was turned down.
const STATUS: Record<ModerationStatus, { label: string; tone: TagTone }> = {
  pending: { label: "Waiting for review", tone: "warning" },
  approved: { label: "Published", tone: "success" },
  rejected: { label: "Not accepted", tone: "danger" },
};

/** What was submitted: the contribution's kind, or the type of submission. */
function kindLabel(s: MySubmission): string {
  const label = s.kind ? CONTRIBUTION_KIND_LABELS[s.kind] : SUBMISSION_TYPE_NOUNS[s.type];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function MySubmissionsPage() {
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <Submissions />
    </>
  );
}

async function Submissions() {
  const user = await requireUser("/me");
  const problems = new Map((await getProblems()).map((p) => [p.id, p]));
  // Published posts only: a pending or rejected post has no page to link to.
  const posts = new Map((await getPosts()).map((p) => [p.id, p]));
  const items = await getMySubmissions(user.id);

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
      {items.map((s) => {
        const problem = s.problemId ? problems.get(s.problemId) : undefined;
        const post = s.postId ? posts.get(s.postId) : undefined;
        // An accepted proposal is on the site, but only among the candidates until the moderators publish it.
        const status = s.type === "proposal" && problem && !problem.published ? { label: "Accepted as a candidate", tone: "success" as const } : STATUS[s.status];
        return (
          <li key={`${s.type}-${s.id}`} className="flex items-start justify-between gap-x-6 gap-y-2 border-t border-rule py-5 max-sm:flex-col">
            <div className="min-w-0">
              <p className={s.type === "comment" ? "italic" : "font-bold"}>
                {s.type === "post" && post ? (
                  <Link href={`/blog/${post.slug}`} className="text-ink hover:text-brand">
                    {s.title}
                  </Link>
                ) : s.type === "contribution" && s.key ? (
                  <Link href={permalinkPath(s.key)} className="text-ink hover:text-brand">
                    {s.title}
                  </Link>
                ) : (
                  s.title
                )}
              </p>
              <p className="mt-1 text-[0.95rem] text-ink-subtle">
                {kindLabel(s)}
                {problem && (
                  <>
                    {" on "}
                    <Link href={`/problems/${problem.slug}`} className="text-brand hover:underline">
                      {problemLabel(problem)}
                    </Link>
                  </>
                )}
                {s.type === "comment" && post && (
                  <>
                    {" on "}
                    <Link href={`/blog/${post.slug}`} className="text-brand hover:underline">
                      {post.title}
                    </Link>
                  </>
                )}
                {" · "}
                {formatDate(s.createdAt)}
                {s.key && (
                  <>
                    {" · "}
                    <Link href={permalinkPath(s.key)} className="text-brand tabular-nums hover:underline" title="Permanent link, for citing">
                      {SITE.name} {s.key}
                    </Link>
                  </>
                )}
              </p>
              {s.reviewNote && (
                <p className="mt-3 border-l-2 border-rule-strong pl-3 text-[0.95rem] text-ink-muted">
                  <span className="font-bold text-ink">Moderator&apos;s note:</span> {s.reviewNote}
                </p>
              )}
            </div>
            <Tag tone={status.tone} className="mt-1 shrink-0 max-sm:order-first">
              {status.label}
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
