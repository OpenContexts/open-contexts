import Link from "next/link";
import { notFound } from "next/navigation";
import { QuickDecision } from "@/components/admin/quick-decision";
import { TypePill } from "@/components/admin/type-pill";
import { AdminButtonLink, Avatar, EmptyState, PageHeader, Pill, Segmented } from "@/components/admin/ui";
import { MarkdownContent } from "@/components/markdown/markdown";
import { requireModerator } from "@/lib/auth/session";
import {
  AI_USE_LABELS,
  MODERATION_STATUSES,
  type ModerationStatus,
  QUICK_DECISION_TYPES,
  SUBMISSION_TYPES,
  SUBMISSION_TYPE_LABELS,
  type SubmissionType,
} from "@/lib/constants";
import { listSubmissions, type QueueItem } from "@/lib/data/moderation";
import { formatRelative, plural } from "@/lib/format";
import { cn } from "@/lib/cn";

const DESCRIPTIONS: Record<SubmissionType, string> = {
  comment: "Discussion posts on problem pages and blog posts.",
  contribution: "Results and references attached to problems.",
  revision: "Suggested changes to a problem's text or status.",
  proposal: "Suggested new problems for the list.",
  post: "Blog posts written for the site. Approving publishes them under /blog.",
};

/** Longer texts are cut off in the list; the review page shows them in full. */
const LONG_TEXT = 600;

export default async function QueuePage({ params, searchParams }: PageProps<"/admin/queue/[type]">) {
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
      <PageHeader title={SUBMISSION_TYPE_LABELS[type]} description={DESCRIPTIONS[type]} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Filter by status"
          items={MODERATION_STATUSES.map((s) => ({
            href: s === "pending" ? `/admin/queue/${type}` : `/admin/queue/${type}?status=${s}`,
            active: s === status,
            label: <span className="capitalize">{s}</span>,
          }))}
        />
        {items.length > 0 && <p className="text-zinc-500">{plural(items.length, status === "pending" ? "item waiting" : "item", status === "pending" ? "items waiting" : "items")}</p>}
      </div>

      {items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <QueueCard key={item.id} type={type} item={item} quick={quick} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={status === "pending" ? "Nothing to review" : `No ${status} submissions`}
          description={status === "pending" ? "New submissions of this kind will appear here." : undefined}
        />
      )}
    </>
  );
}

/**
 * One submission: the problem or post it belongs to, then what it is (coloured by type) and the submission
 * itself in the site's typography, then who sent it next to the actions. Comments and results can be decided
 * right here; edits, proposals and blog posts open the review page.
 */
function QueueCard({ type, item, quick }: { type: SubmissionType; item: QueueItem; quick: boolean }) {
  const long = (item.body?.length ?? 0) > LONG_TEXT;
  const review = `/admin/review/${type}/${item.id}`;
  // Only worth showing when someone else is credited than the person who sent it.
  const credit = item.credit && item.credit.trim() !== item.author.name.trim() ? item.credit : undefined;
  return (
    <li className="overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-zinc-200">
      <header className="flex items-baseline justify-between gap-4 border-b border-zinc-100 px-5 py-3">
        {item.on?.href ? (
          <Link href={item.on.href} target="_blank" className="min-w-0 truncate text-[15px] font-semibold text-zinc-900 hover:underline">
            {item.on.label} <span className="font-normal text-zinc-400">↗</span>
          </Link>
        ) : (
          <span className="min-w-0 truncate text-[15px] font-semibold text-zinc-900">
            {item.on?.label ?? (type === "proposal" ? "New problem" : type === "post" ? "Blog post" : "A deleted problem or post")}
          </span>
        )}
        <span className="flex-none text-xs text-zinc-500">{formatRelative(item.createdAt)}</span>
      </header>

      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypePill type={type} kind={item.kind} />
          {item.aiUse && <Pill>{AI_USE_LABELS[item.aiUse].replace(/^./, (c) => c.toUpperCase())}</Pill>}
          {credit && <Pill>Credit: {credit}</Pill>}
        </div>
        {type !== "comment" && (
          <Link href={review} className="mt-2.5 block text-base font-semibold text-zinc-900 hover:underline">
            {item.title}
          </Link>
        )}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 block max-w-full truncate text-xs text-sky-700 hover:underline">
            ↗ {item.url.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        )}
        {(item.body ?? item.excerpt) && (
          <div className={cn("mt-3 font-serif text-[16px]/normal text-ink", long && "max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]")}>
            {item.body ? <MarkdownContent source={item.body} untrusted references={item.references} /> : <p className="text-zinc-600">{item.excerpt}</p>}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={item.author.name} className="size-7 text-[11px]" />
          <p className="min-w-0 truncate text-xs">
            <span className="font-medium text-zinc-900">{item.author.name}</span> <span className="text-zinc-500">{item.author.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButtonLink href={review} variant="ghost" size="sm">
            {quick && long ? "Read in full" : "View details"}
          </AdminButtonLink>
          {quick ? (
            <QuickDecision type={type} id={item.id} />
          ) : (
            <AdminButtonLink href={review} variant="primary" size="sm">
              Review
            </AdminButtonLink>
          )}
        </div>
      </footer>
    </li>
  );
}
