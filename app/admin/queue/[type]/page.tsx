import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuickDecision } from "@/components/admin/quick-decision";
import { AdminButtonLink, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { MarkdownContent } from "@/components/markdown/markdown";
import { requireModerator } from "@/lib/auth/session";
import {
  MODERATION_STATUSES,
  type ModerationStatus,
  QUICK_DECISION_TYPES,
  SUBMISSION_TYPES,
  SUBMISSION_TYPE_LABELS,
  type SubmissionType,
} from "@/lib/constants";
import { listSubmissions, type QueueItem } from "@/lib/data/moderation";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";

const DESCRIPTIONS: Record<SubmissionType, string> = {
  comment: "Discussion posts on problem pages.",
  contribution: "Results and references attached to problems.",
  link: "Proposed connections between problems.",
  revision: "Suggested changes to a problem's text or status.",
  proposal: "Suggested new problems for the list.",
};

/** Longer texts are cut off in the list; the review page shows them in full. */
const LONG_TEXT = 600;

export default function QueuePage({ params, searchParams }: PageProps<"/admin/queue/[type]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-100" />}>
      <Queue params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Queue({ params, searchParams }: Pick<PageProps<"/admin/queue/[type]">, "params" | "searchParams">) {
  await requireModerator();
  const { type: rawType } = (await params) as { type: string };
  const type = SUBMISSION_TYPES.find((t) => t === rawType);
  if (!type) notFound();
  const raw = (await searchParams).status;
  const status: ModerationStatus = MODERATION_STATUSES.find((s) => s === raw) ?? "pending";
  const items = await listSubmissions(type, status);
  const quick = status === "pending" && QUICK_DECISION_TYPES.includes(type);

  return (
    <>
      <PageHeader
        title={SUBMISSION_TYPE_LABELS[type]}
        description={
          <>
            {DESCRIPTIONS[type]}
            {status === "pending" && items.length > 0 && (
              <>
                {" "}
                {quick
                  ? "Approve or reject right here, or open an item to add a note for the author."
                  : "Open an item to review it in full before deciding."}
              </>
            )}
          </>
        }
      />
      <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-0.5">
        {MODERATION_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "pending" ? `/admin/queue/${type}` : `/admin/queue/${type}?status=${s}`}
            className={cn("rounded-md px-3 py-1 capitalize transition", s === status ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900")}
          >
            {s}
          </Link>
        ))}
      </div>

      {items.length ? (
        <Card padded={false}>
          <ul className="divide-y divide-zinc-100">
            {items.map((item) => (quick ? <QuickRow key={item.id} type={type} item={item} /> : <LinkRow key={item.id} type={type} item={item} />))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          title={status === "pending" ? "Nothing to review" : `No ${status} submissions`}
          description={status === "pending" ? "New submissions of this kind will appear here." : undefined}
        />
      )}
    </>
  );
}

function Meta({ type, item }: { type: SubmissionType; item: QueueItem }) {
  return (
    <p className="mt-1 text-xs text-zinc-400">
      {item.author.name} · {item.author.email}
      {/* A comment's title already names its problem. */}
      {item.problemLabel && type !== "comment" && <> · {item.problemLabel}</>} · {formatRelative(item.createdAt)}
    </p>
  );
}

/** The whole row opens the review page. */
function LinkRow({ type, item }: { type: SubmissionType; item: QueueItem }) {
  return (
    <li>
      <Link href={`/admin/review/${type}/${item.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-zinc-900">{item.title}</p>
          {item.excerpt && <p className="mt-0.5 truncate text-zinc-500">{item.excerpt}</p>}
          <Meta type={type} item={item} />
        </div>
        <span aria-hidden className="text-zinc-300 group-hover:text-zinc-900">
          →
        </span>
      </Link>
    </li>
  );
}

/** Shows the submission itself, with approve and reject next to it. */
function QuickRow({ type, item }: { type: SubmissionType; item: QueueItem }) {
  const long = (item.body?.length ?? 0) > LONG_TEXT;
  const review = `/admin/review/${type}/${item.id}`;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="min-w-0 flex-1">
        <Link href={review} className="font-medium text-zinc-900 hover:underline">
          {item.title}
        </Link>
        {item.details && <p className="mt-0.5 text-xs text-zinc-500">{item.details.join(" · ")}</p>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 block truncate text-xs text-zinc-600 underline decoration-zinc-300 underline-offset-2">
            {item.url}
          </a>
        )}
        {item.body && (
          <div
            className={cn(
              "mt-2 font-serif text-[15px]/normal text-ink",
              long && "max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]",
            )}
          >
            <MarkdownContent source={item.body} untrusted />
          </div>
        )}
        <Meta type={type} item={item} />
      </div>
      <div className="flex flex-none items-center gap-2 sm:flex-col sm:items-end">
        <QuickDecision type={type} id={item.id} />
        <AdminButtonLink href={review} variant="ghost" size="sm">
          {long ? "Read all" : "Details"} →
        </AdminButtonLink>
      </div>
    </li>
  );
}
