import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { contributionLook, KindTag, type KindLook } from "@/components/problems/kind-tag";
import { AppleIcon, ButtonLink, PageTitle, TabLink, Tabs, Tag, type TagTone } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { MODERATION_STATUSES, type ModerationStatus, type SubmissionType } from "@/lib/constants";
import { getPosts } from "@/lib/data/blog";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { getMySubmissions, markSubmissionsSeen, type MySubmission } from "@/lib/data/submissions";
import { formatDate, formatNames, plural } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "My submissions", robots: { index: false } };

// Same colours as everywhere else: gold waits, green is published, red was turned down.
const STATUS: Record<ModerationStatus, { label: string; tone: TagTone }> = {
  pending: { label: "Waiting for review", tone: "warning" },
  approved: { label: "Published", tone: "success" },
  rejected: { label: "Not accepted", tone: "danger" },
};

/** The tag for what was submitted: a contribution's kind in its colour, the other types in grey. */
const TYPE_LOOKS: Record<Exclude<SubmissionType, "contribution">, KindLook> = {
  comment: { label: "Comment", tone: "neutral" },
  revision: { label: "Suggested edit", tone: "neutral" },
  proposal: { label: "Problem proposal", tone: "neutral" },
  post: { label: "Blog post", tone: "neutral" },
};

function typeLook(s: MySubmission): KindLook {
  if (s.type === "contribution") return s.kind ? contributionLook(s.kind) : { label: "Result", tone: "neutral" };
  if (s.reply) return { label: "Reply", tone: "neutral" };
  return TYPE_LOOKS[s.type];
}

const isStatus = (v: unknown): v is ModerationStatus => MODERATION_STATUSES.includes(v as ModerationStatus);

/** The `since` the tabs pass on: a time, or null for "never" (a first visit, so everything decided is new). */
function readSince(value: string | string[] | undefined): Date | null | undefined {
  if (value === "never") return null;
  const date = typeof value === "string" ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

export default function MySubmissionsPage({ searchParams }: PageProps<"/me">) {
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <p className="text-center text-ink-muted">Everything you have submitted, and where it stands. Others see only what has been published.</p>
      <Submissions searchParams={searchParams} />
    </>
  );
}

async function Submissions({ searchParams }: Pick<PageProps<"/me">, "searchParams">) {
  const user = await requireUser("/me");
  const { status: param, since: sinceParam } = await searchParams;
  const status = isStatus(param) ? param : undefined;
  // Opening the page counts as seeing every decision so far; those made since the last visit are marked as new.
  // The tabs pass on when that was (`since`), so the marks stay while switching between them; opening /me again
  // starts afresh.
  const [problemList, postList, items, seenBefore] = await Promise.all([getProblems(), getPosts(), getMySubmissions(user.id), markSubmissionsSeen(user.id)]);
  const passed = readSince(sinceParam);
  const since = passed === undefined ? seenBefore : passed;
  const isNew = (s: MySubmission) => !!s.reviewedAt && (!since || s.reviewedAt > since);
  const newComments = (s: MySubmission) => (s.comments ?? []).filter((at) => !since || at > since).length;
  const problems = new Map(problemList.map((p) => [p.id, p]));
  // Published posts only: a pending or rejected post has no page to link to.
  const posts = new Map(postList.map((p) => [p.id, p]));

  if (!items.length) {
    return (
      <div className="mt-10 text-center">
        <p className="mb-4 text-ink-muted">You have not submitted anything yet.</p>
        <ButtonLink href="/contribute">How to contribute</ButtonLink>
      </div>
    );
  }

  const shown = status ? items.filter((s) => s.status === status) : items;
  const news = items.filter(isNew).length;
  const comments = items.reduce((n, s) => n + newComments(s), 0);
  const tab = (s?: ModerationStatus) => {
    const query = new URLSearchParams({ ...(s && { status: s }), ...(news + comments > 0 && { since: since?.toISOString() ?? "never" }) });
    return query.size ? `/me?${query}` : "/me";
  };
  return (
    <>
      {news + comments > 0 && (
        <p className="mb-5 text-center text-[0.98rem]">
          <AppleIcon className="mr-1.5" />
          Since your last visit:{" "}
          {formatNames([
            ...(news ? [news === 1 ? "one of your submissions was reviewed" : `${news} of your submissions were reviewed`] : []),
            ...(comments ? [comments === 1 ? "one new comment on your contributions" : `${comments} new comments on your contributions`] : []),
          ])}
          . They are marked below.
        </p>
      )}
      <Tabs label="Filter by review status" className="mb-6">
        <TabLink href={tab()} active={!status} count={items.length}>
          All
        </TabLink>
        {MODERATION_STATUSES.map((s) => (
          <TabLink key={s} href={tab(s)} active={status === s} count={items.filter((i) => i.status === s).length}>
            {STATUS[s].label}
          </TabLink>
        ))}
      </Tabs>
      {shown.length ? (
        <ul className="space-y-4">
          {shown.map((s) => (
            <SubmissionCard key={`${s.type}-${s.id}`} item={s} isNew={isNew(s)} newComments={newComments(s)} problem={s.problemId ? problems.get(s.problemId) : undefined} post={s.postId ? posts.get(s.postId) : undefined} />
          ))}
        </ul>
      ) : (
        <p className="text-center text-ink-muted">Nothing here.</p>
      )}
    </>
  );
}

type ProblemRef = { slug: string; number: number; title: string; published: boolean };

/**
 * One submission, laid out like the contributions on a problem page: what it is, when, and its review status
 * along the top; then what it says, where it was made, its permanent link once published, and the moderators'
 * note, if any.
 */
function SubmissionCard({
  item: s,
  isNew,
  newComments,
  problem,
  post,
}: {
  item: MySubmission;
  isNew: boolean;
  /** Comments by others on a contribution since the last visit. */
  newComments: number;
  problem?: ProblemRef;
  post?: { slug: string; title: string };
}) {
  // An accepted proposal is on the site, but only among the candidates until the moderators publish it.
  const status = s.type === "proposal" && problem && !problem.published ? { label: "Accepted as a candidate", tone: "success" as const } : STATUS[s.status];
  // Where the submission itself can be seen, if anywhere: its own page, or the problem a proposal became.
  const href = s.type === "post" && post ? `/blog/${post.slug}` : s.key ? permalinkPath(s.key) : s.type === "proposal" && problem ? `/problems/${problem.slug}` : undefined;
  const context: ReactNode =
    s.type === "proposal" ? (
      problem && <>Became {problemLink(problem)}</>
    ) : problem ? (
      <>On {problemLink(problem)}</>
    ) : s.type === "comment" && post ? (
      <>
        On the blog post{" "}
        <Link href={`/blog/${post.slug}`} className="text-brand hover:underline">
          {post.title}
        </Link>
      </>
    ) : undefined;

  return (
    <li className={cn("overflow-hidden rounded-md border bg-paper", isNew ? "border-brand/50 ring-1 ring-brand/30" : "border-rule")}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-rule bg-surface px-4 py-2">
        <KindTag look={typeLook(s)} />
        <span className="text-sm text-ink-subtle">{formatDate(s.createdAt)}</span>
        {isNew && (
          <span className="ml-auto flex items-center gap-1 font-sans text-xs font-bold text-brand">
            <AppleIcon />
            New{s.reviewedAt && <span className="font-normal text-ink-subtle"> · reviewed {formatDate(s.reviewedAt)}</span>}
          </span>
        )}
        <Tag tone={status.tone} className={cn(!isNew && "ml-auto")}>
          {status.label}
        </Tag>
      </div>
      <div className="px-4 pt-3 pb-3.5">
        {s.type === "comment" ? (
          <p className="text-ink-muted italic">“{s.title}”</p>
        ) : (
          <p className="text-[1.05rem] font-bold">
            {href ? (
              <Link href={href} className="text-ink hover:text-brand">
                {s.title}
              </Link>
            ) : (
              s.title
            )}
          </p>
        )}
        {(context || s.key) && (
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.95rem] text-ink-subtle">
            {context && <span>{context}</span>}
            {s.key && (
              <Link href={permalinkPath(s.key)} className="tabular-nums hover:text-brand hover:underline" title="Permanent link, for citing">
                {SITE.name} {s.key}
              </Link>
            )}
          </p>
        )}
        {s.key && !!s.comments?.length && (
          <p className="mt-2 flex items-center gap-1.5 text-[0.95rem]">
            <Link href={`${permalinkPath(s.key)}#discussion`} className="text-brand hover:underline">
              {plural(s.comments.length, "comment")} by others
            </Link>
            {newComments > 0 && (
              <span className="flex items-center gap-1 font-sans text-xs font-bold text-brand">
                <AppleIcon /> {newComments} new
              </span>
            )}
          </p>
        )}
        {s.reviewNote && <ModeratorNote note={s.reviewNote} rejected={s.status === "rejected"} />}
      </div>
    </li>
  );
}

/**
 * What the moderators wrote with their decision, framed in a colour so it is not missed: red with a rejection,
 * where it usually says why, blue otherwise.
 */
function ModeratorNote({ note, rejected }: { note: string; rejected: boolean }) {
  return (
    <div className={cn("mt-3.5 rounded-md px-4 py-3 ring-1 ring-inset", rejected ? "bg-brand-tint ring-brand/35" : "bg-info-tint ring-info/35")}>
      <p className={cn("flex items-center gap-1.5 font-sans text-[0.72rem] font-bold tracking-[0.12em] uppercase", rejected ? "text-brand" : "text-info")}>
        <span aria-hidden className="text-sm/none">✎</span>
        Note from the moderators
      </p>
      <p className="mt-1.5 text-ink">{note}</p>
    </div>
  );
}

function problemLink(problem: ProblemRef) {
  return (
    <Link href={`/problems/${problem.slug}`} className="text-brand hover:underline">
      {problemLabel(problem)}
    </Link>
  );
}
