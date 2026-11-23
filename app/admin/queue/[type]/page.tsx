import Link from "next/link";
import { notFound } from "next/navigation";
import { QuickDecision } from "@/components/admin/quick-decision";
import { TypePill } from "@/components/admin/type-pill";
import { AdminButtonLink, Avatar, Card, EmptyState, PageHeader, Pager, pageParam, Segmented } from "@/components/admin/ui";
import { MarkdownContent } from "@/components/markdown/markdown";
import { MathText } from "@/components/markdown/math-text";
import { requireModerator } from "@/lib/auth/session";
import { canDecideQuickly, MODERATION_STATUSES, type ModerationStatus, SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS, type SubmissionType } from "@/lib/constants";
import { listSubmissions, QUEUE_PER_PAGE, type QueueItem } from "@/lib/data/moderation";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const DESCRIPTIONS: Record<SubmissionType, string> = {
  comment: "Discussion posts on problem pages and blog posts.",
  contribution: "Results and references attached to problems. Open one to read it; references can be decided from the list.",
  revision: "Suggested changes to a problem's text or status.",
  proposal: "Suggested new problems for the list.",
  post: "Blog posts written for the site. Approving publishes them under /blog.",
};

/** Comments longer than this are cut off in the list; the review page shows them in full. */
const LONG_COMMENT = 400;

function queueHref(type: SubmissionType, status: ModerationStatus, page = 1): string {
  const search = new URLSearchParams();
  if (status !== "pending") search.set("status", status);
  if (page > 1) search.set("page", String(page));
  const s = search.toString();
  return s ? `/admin/queue/${type}?${s}` : `/admin/queue/${type}`;
}

export default async function QueuePage({ params, searchParams }: PageProps<"/admin/queue/[type]">) {
  await requireModerator();
  const { type: rawType } = (await params) as { type: string };
  const type = SUBMISSION_TYPES.find((t) => t === rawType);
  if (!type) notFound();
  const raw = await searchParams;
  const status: ModerationStatus = MODERATION_STATUSES.find((s) => s === raw.status) ?? "pending";
  const page = pageParam(raw.page);
  const { items, total, pages } = await listSubmissions(type, status, page);
  const pending = status === "pending";

  return (
    <>
      <PageHeader title={SUBMISSION_TYPE_LABELS[type]} description={DESCRIPTIONS[type]} />
      <div className="mb-5">
        <Segmented
          label="Filter by status"
          items={MODERATION_STATUSES.map((s) => ({ href: queueHref(type, s), active: s === status, label: <span className="capitalize">{s}</span> }))}
        />
      </div>

      {items.length ? (
        <Card padded={false}>
          <ul className="divide-y divide-zinc-100">
            {items.map((item) =>
              type === "comment" ? <CommentRow key={item.id} item={item} pending={pending} /> : <SubmissionRow key={item.id} type={type} item={item} pending={pending} />,
            )}
          </ul>
          <Pager
            page={page}
            pages={pages}
            total={total}
            shown={items.length}
            perPage={QUEUE_PER_PAGE}
            noun={pending ? ["item waiting", "items waiting"] : ["item"]}
            href={(p) => queueHref(type, status, p)}
            className="border-t border-zinc-100"
          />
        </Card>
      ) : (
        <EmptyState
          title={total ? "Nothing on this page" : pending ? "Nothing to review" : `No ${status} submissions`}
          description={
            total ? (
              <Link href={queueHref(type, status)} className="underline">
                Back to the first page
              </Link>
            ) : pending ? (
              "New submissions of this kind will appear here."
            ) : undefined
          }
        />
      )}
    </>
  );
}

/**
 * A result, edit, proposal or blog post on one line: what it is called (with its kind, for results) and what it
 * belongs to. It is read and decided on the review page; only references can be decided here (canDecideQuickly).
 */
function SubmissionRow({ type, item, pending }: { type: SubmissionType; item: QueueItem; pending: boolean }) {
  const review = `/admin/review/${type}/${item.id}`;
  const quick = pending && canDecideQuickly(type, item.kind);
  const about = item.on?.label ?? item.excerpt;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-zinc-50/70">
      <div className="min-w-0 flex-1 basis-72">
        <div className="flex min-w-0 items-center gap-2">
          {type === "contribution" && <TypePill type={type} kind={item.kind} />}
          <Link href={review} className="min-w-0 truncate font-medium text-zinc-900 hover:underline">
            <MathText text={item.title} />
          </Link>
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {about && <MathText text={about} />}
          {type !== "contribution" && <> · by {item.author.name}</>}
          <span className="text-zinc-400"> · {formatRelative(item.createdAt)}</span>
        </p>
      </div>
      <div className="flex flex-none items-center gap-2">
        {quick ? (
          <>
            <AdminButtonLink href={review} variant="ghost" size="sm">
              View
            </AdminButtonLink>
            <QuickDecision type={type} id={item.id} />
          </>
        ) : (
          <AdminButtonLink href={review} variant={pending ? "primary" : "secondary"} size="sm">
            {pending ? "Review" : "View"}
          </AdminButtonLink>
        )}
      </div>
    </li>
  );
}

/**
 * A comment as in a discussion: who wrote it where and when, then the text itself, cut off when long, and the
 * decision next to it.
 */
function CommentRow({ item, pending }: { item: QueueItem; pending: boolean }) {
  const review = `/admin/review/comment/${item.id}`;
  const long = (item.body?.length ?? 0) > LONG_COMMENT;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2.5 px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <Avatar name={item.author.name} className="size-7 text-[11px]" />
      <div className="min-w-0">
        <p className="truncate text-sm leading-7 text-zinc-500">
          <span className="font-medium text-zinc-900" title={item.author.email}>
            {item.author.name}
          </span>{" "}
          {item.reply ? "replied" : "commented"} on{" "}
          {item.on ? (
            item.on.href ? (
              <Link href={item.on.href} target="_blank" className="text-zinc-700 hover:underline">
                <MathText text={item.on.label} />
              </Link>
            ) : (
              <MathText text={item.on.label} />
            )
          ) : (
            "a deleted problem or post"
          )}
          <span className="text-zinc-400"> · {formatRelative(item.createdAt)}</span>
        </p>
        {item.body && (
          <div className={cn("mt-1 font-serif text-[15px]/normal text-ink", long && "max-h-32 overflow-hidden mask-[linear-gradient(to_bottom,black_55%,transparent)]")}>
            <MarkdownContent source={item.body} untrusted references={item.references} />
          </div>
        )}
        {long && (
          <Link href={review} className="mt-1 inline-block text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
            Read in full →
          </Link>
        )}
      </div>
      <div className="col-start-2 flex items-start gap-2 sm:col-start-3">
        {pending ? (
          <QuickDecision type="comment" id={item.id} />
        ) : (
          <AdminButtonLink href={review} size="sm">
            View
          </AdminButtonLink>
        )}
      </div>
    </li>
  );
}
