// The parts of /me, /me/contributions and /me/comments: what a user submitted and where it stands.
import Link from "next/link";
import type { ReactNode } from "react";
import { contributionLook, type KindLook, KindTag } from "@/components/problems/kind-tag";
import { AppleIcon, SegmentLink, Segmented, TabLink, Tabs, type TagTone, toneColors } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { MODERATION_STATUSES, type ModerationStatus, type SubmissionType } from "@/lib/constants";
import { getPosts } from "@/lib/data/blog";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { getMySubmissions, markSubmissionsSeen, type MySubmission } from "@/lib/data/submissions";
import { formatDate, plural } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

export type MyPage = "/me" | "/me/contributions" | "/me/comments";

type ProblemRef = { slug: string; number: number; title: string; published: boolean };

/** Everything the /me pages show, and what is new on them. */
export type Mine = {
  items: MySubmission[];
  isNew: (s: MySubmission) => boolean;
  newComments: (s: MySubmission) => number;
  problems: Map<string, ProblemRef>;
  posts: Map<string, { slug: string; title: string }>;
  /** A link to one of the /me pages that keeps the marks of what is new (see loadMine). */
  link: (page: MyPage, status?: ModerationStatus) => string;
};

const isStatus = (v: unknown): v is ModerationStatus => MODERATION_STATUSES.includes(v as ModerationStatus);

/** The status in the URL (?status=pending), if any. */
export const readStatus = (value: string | string[] | undefined) => (isStatus(value) ? value : undefined);

/** The `since` the links pass on: a time, or null for "never" (a first visit, so everything decided is new). */
function readSince(value: string | string[] | undefined): Date | null | undefined {
  if (value === "never") return null;
  const date = typeof value === "string" ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

/**
 * The signed-in user's submissions, for one of the /me pages. Opening any of them counts as seeing every decision
 * so far; those made since the last visit are marked as new. The links between the pages pass on when that was
 * (`since`), so the marks stay while moving between them; opening /me again from the menu starts afresh.
 */
export async function loadMine(page: MyPage, query: Record<string, string | string[] | undefined>): Promise<Mine> {
  const user = await requireUser(page);
  const [problemList, postList, items, seenBefore] = await Promise.all([getProblems(), getPosts(), getMySubmissions(user.id), markSubmissionsSeen(user.id)]);
  const passed = readSince(query.since);
  const since = passed === undefined ? seenBefore : passed;
  const isNew = (s: MySubmission) => !!s.reviewedAt && (!since || s.reviewedAt > since);
  const newComments = (s: MySubmission) => (s.comments ?? []).filter((at) => !since || at > since).length;
  const anyNews = items.some((s) => isNew(s) || newComments(s) > 0);
  return {
    items,
    isNew,
    newComments,
    problems: new Map(problemList.map((p) => [p.id, p])),
    // Published posts only: a pending or rejected post has no page to link to.
    posts: new Map(postList.map((p) => [p.id, p])),
    link: (to, status) => {
      const params = new URLSearchParams({ ...(status && { status }), ...(anyNews && { since: since?.toISOString() ?? "never" }) });
      return params.size ? `${to}?${params}` : to;
    },
  };
}

/** Comments and replies go on /me/comments; everything else (results, references, edits, proposals, posts) on /me/contributions. */
export const isComment = (s: MySubmission) => s.type === "comment";

/** The three pages, as tabs. Not prefetched: opening one records the visit, which only a click should do. */
export function MyNav({ mine, current }: { mine: Mine; current: MyPage }) {
  const comments = mine.items.filter(isComment).length;
  const pages: { page: MyPage; label: string; count?: number }[] = [
    { page: "/me", label: "Overview" },
    { page: "/me/contributions", label: "Contributions", count: mine.items.length - comments },
    { page: "/me/comments", label: "Comments", count: comments },
  ];
  return (
    <Tabs label="My submissions" className="mb-7">
      {pages.map((p) => (
        <TabLink key={p.page} href={mine.link(p.page)} prefetch={false} active={p.page === current} count={p.count}>
          {p.label}
        </TabLink>
      ))}
    </Tabs>
  );
}

// Same colours as everywhere else: gold waits, green is published, red was turned down.
const STATUS: Record<ModerationStatus, { label: string; tone: TagTone }> = {
  pending: { label: "Waiting for review", tone: "warning" },
  approved: { label: "Published", tone: "success" },
  rejected: { label: "Not accepted", tone: "danger" },
};

/** For "3 published · 1 waiting". */
export const STATUS_WORDS: Record<ModerationStatus, string> = { pending: "waiting", approved: "published", rejected: "not accepted" };

/** All, or only those waiting, published or not accepted, each with how many there are. */
export function StatusFilter({ mine, page, items, status }: { mine: Mine; page: MyPage; items: MySubmission[]; status?: ModerationStatus }) {
  return (
    <Segmented label="Filter by review status">
      <SegmentLink href={mine.link(page)} active={!status} count={items.length}>
        All
      </SegmentLink>
      {MODERATION_STATUSES.map((s) => (
        <SegmentLink key={s} href={mine.link(page, s)} active={status === s} count={items.filter((i) => i.status === s).length}>
          {s === "pending" ? "Waiting" : STATUS[s].label}
        </SegmentLink>
      ))}
    </Segmented>
  );
}

/** Submissions, newest first: each a card of its own, or (`rows`, for the comments) as rows in one frame. */
export function SubmissionList({ mine, items, empty, rows }: { mine: Mine; items: MySubmission[]; empty: string; rows?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-ink-muted">{empty}</p>;
  return (
    <ul className={rows ? "divide-y divide-rule overflow-hidden rounded-md border border-rule bg-paper" : "space-y-3.5"}>
      {items.map((s) => (
        <SubmissionItem key={`${s.type}-${s.id}`} item={s} mine={mine} card={!rows} />
      ))}
    </ul>
  );
}

/** The tag for what was submitted: a contribution's kind in its colour, the other types in grey. Comments show none; theirs names them in the news. */
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

/** Where a submission stands; an accepted proposal is on the site, but only among the candidates until it is published. */
function statusOf(s: MySubmission, problem?: ProblemRef) {
  return s.type === "proposal" && s.status === "approved" && problem && !problem.published ? { label: "Accepted as a candidate", tone: "success" as const } : STATUS[s.status];
}

const STATUS_TEXT: Record<TagTone, string> = { neutral: "text-ink-muted", success: "text-success", info: "text-info", warning: "text-gold-dark", danger: "text-brand" };

function StatusLabel({ status, className }: { status: { label: string; tone: TagTone }; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-sans text-xs font-bold whitespace-nowrap", STATUS_TEXT[status.tone], className)}>
      <span aria-hidden className={cn("size-2 rounded-full", toneColors[status.tone].bg)} />
      {status.label}
    </span>
  );
}

/** Where the submission itself can be seen, if anywhere: its own page, or the problem a proposal became. */
function pageOf(s: MySubmission, problem?: ProblemRef, post?: { slug: string }) {
  if (s.type === "post") return post && `/blog/${post.slug}`;
  if (s.key) return permalinkPath(s.key);
  return s.type === "proposal" && problem ? `/problems/${problem.slug}` : undefined;
}

/**
 * One submission: what it is (except for comments, which are all alike), whether it is new and where it stands,
 * along the top of a card; what it says; where it was made, when, its permanent link and the comments others
 * wrote on it; and the moderators' note, if any.
 */
function SubmissionItem({ item: s, mine, card }: { item: MySubmission; mine: Mine; card: boolean }) {
  const problem = s.problemId ? mine.problems.get(s.problemId) : undefined;
  const post = s.postId ? mine.posts.get(s.postId) : undefined;
  const href = pageOf(s, problem, post);
  const isNew = mine.isNew(s);
  const fresh = mine.newComments(s);
  const comment = s.type === "comment";
  const on = s.reply ? "Reply on" : "On";
  const context: ReactNode =
    s.type === "proposal" ? (
      problem && <>Became {problemLink(problem)}</>
    ) : problem ? (
      <>
        {on} {problemLink(problem)}
      </>
    ) : comment && post ? (
      <>
        {on} the blog post{" "}
        <Link href={`/blog/${post.slug}`} className="text-brand hover:underline">
          {post.title}
        </Link>
      </>
    ) : undefined;
  const marks = (
    <>
      {isNew && (
        <span className="flex shrink-0 items-center gap-1 font-sans text-xs font-bold text-brand">
          <AppleIcon /> New
        </span>
      )}
      <StatusLabel status={statusOf(s, problem)} className="ml-auto shrink-0" />
    </>
  );

  return (
    <li className={card ? cn("overflow-hidden rounded-md border bg-paper", isNew ? "border-brand/50 ring-1 ring-brand/30" : "border-rule") : cn(isNew && "bg-brand-tint/70")}>
      {!comment && (
        <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4", card ? "border-b border-rule bg-surface py-2" : "pt-3")}>
          <KindTag look={typeLook(s)} />
          {marks}
        </div>
      )}
      <div className={cn("px-4 pb-3.5", comment || card ? "pt-3" : "pt-1.5")}>
        {comment ? (
          <div className="flex items-baseline gap-x-3">
            <p className="min-w-0 flex-1 text-ink-muted italic">
              {href ? (
                <Link href={href} className="text-inherit hover:text-brand">
                  “{s.title}”
                </Link>
              ) : (
                <>“{s.title}”</>
              )}
            </p>
            {marks}
          </div>
        ) : (
          <p className="text-[1.02rem] font-bold">
            {href ? (
              <Link href={href} className="text-ink hover:text-brand">
                {s.title}
              </Link>
            ) : (
              s.title
            )}
          </p>
        )}
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-subtle">
          {context && <span>{context}</span>}
          <span>
            Submitted {formatDate(s.createdAt)}
            {s.reviewedAt && <>, reviewed {formatDate(s.reviewedAt)}</>}
          </span>
          {s.key && (
            <Link href={permalinkPath(s.key)} className="tabular-nums hover:text-brand hover:underline" title="Permanent link, for citing">
              {SITE.name} {s.key}
            </Link>
          )}
          {s.key && !!s.comments?.length && (
            <span className="flex items-center gap-1.5">
              <Link href={`${permalinkPath(s.key)}#discussion`} className="text-brand hover:underline">
                {plural(s.comments.length, "comment")} by others
              </Link>
              {fresh > 0 && (
                <span className="flex items-center gap-1 font-sans text-xs font-bold text-brand">
                  <AppleIcon /> {fresh} new
                </span>
              )}
            </span>
          )}
        </p>
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
    <div className={cn("mt-3 rounded-md px-4 py-2.5 ring-1 ring-inset", rejected ? "bg-brand-tint ring-brand/35" : "bg-info-tint ring-info/35")}>
      <p className={cn("flex items-center gap-1.5 font-sans text-[0.72rem] font-bold tracking-[0.12em] uppercase", rejected ? "text-brand" : "text-info")}>
        <span aria-hidden className="text-sm/none">✎</span>
        Note from the moderators
      </p>
      <p className="mt-1 text-[0.97rem] text-ink">{note}</p>
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

/** One thing that happened since the last visit: a decision, or new comments on a contribution. */
export type News = { at: Date; item: MySubmission; comments?: number };

/** What happened since the last visit, newest first. */
export function newsOf(mine: Mine): News[] {
  return mine.items
    .flatMap((s): News[] => {
      const fresh = mine.newComments(s);
      return [...(mine.isNew(s) && s.reviewedAt ? [{ at: s.reviewedAt, item: s }] : []), ...(fresh > 0 ? [{ at: s.comments![0], item: s, comments: fresh }] : [])];
    })
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** "Your claimed solution “…” was published", "2 new comments on your claimed solution “…”", each linking to it. */
export function NewsList({ mine, news }: { mine: Mine; news: News[] }) {
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-md border border-brand/40 bg-paper">
      {news.map((n) => {
        const s = n.item;
        const problem = s.problemId ? mine.problems.get(s.problemId) : undefined;
        const post = s.postId ? mine.posts.get(s.postId) : undefined;
        const noun = typeLook(s).label.toLowerCase();
        const href = n.comments && s.key ? `${permalinkPath(s.key)}#discussion` : (pageOf(s, problem, post) ?? mine.link(isComment(s) ? "/me/comments" : "/me/contributions", s.status));
        return (
          <li key={`${s.type}-${s.id}-${n.comments ? "c" : "d"}`} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-2.5 px-4 py-2.5">
            <AppleIcon className="relative top-0.5" />
            <p className="min-w-0">
              {n.comments ? (
                <>
                  <Link href={href} className="font-bold text-brand hover:underline">
                    {plural(n.comments, "new comment")}
                  </Link>{" "}
                  on your {noun} “{s.title}”
                </>
              ) : (
                <>
                  Your {noun}{" "}
                  <Link href={href} className="text-ink hover:text-brand hover:underline">
                    “{s.title}”
                  </Link>{" "}
                  <StatusWord item={s} problem={problem} />
                </>
              )}
              {problem && <span className="text-ink-subtle"> · {problemLabel(problem)}</span>}
            </p>
            <span className="text-sm text-ink-subtle tabular-nums">{formatDate(n.at)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StatusWord({ item: s, problem }: { item: MySubmission; problem?: ProblemRef }) {
  const status = statusOf(s, problem);
  const words = s.status === "pending" ? "is waiting for review" : s.status === "rejected" ? "was not accepted" : status === STATUS.approved ? "was published" : "was accepted as a candidate";
  return <span className={cn("font-bold", STATUS_TEXT[status.tone])}>{words}</span>;
}
