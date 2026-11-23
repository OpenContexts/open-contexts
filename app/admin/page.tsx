import Link from "next/link";
import { setFeaturedPost } from "@/app/admin/actions";
import { ActionPill, AdminButton, AdminSelect, Card, EmptyState, PageHeader, Pill } from "@/components/admin/ui";
import { RefreshCacheButton } from "@/components/admin/refresh-cache";
import { isAdmin, requireModerator } from "@/lib/auth/session";
import { LOG_TARGET_NOUNS, SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import { getPosts } from "@/lib/data/blog";
import { getPendingCounts, getRecentActivity, logTargetHref } from "@/lib/data/moderation";
import { formatDate, formatRelative } from "@/lib/format";

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader title="Overview" description="Submissions waiting for a decision, and what was decided recently." />
      <Overview />
    </>
  );
}

async function Overview() {
  const user = await requireModerator();
  const [counts, decisions, posts] = await Promise.all([getPendingCounts(), getRecentActivity(8), getPosts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {SUBMISSION_TYPES.map((t) => (
          <Link key={t} href={`/admin/queue/${t}`} className="group rounded-xl bg-white p-5 shadow-xs ring-1 ring-zinc-200 transition hover:ring-zinc-400">
            <p className="flex items-center justify-between text-zinc-500">
              {SUBMISSION_TYPE_LABELS[t]}
              {counts[t] > 0 && (
                <Pill tone="amber" dot>
                  Waiting
                </Pill>
              )}
            </p>
            <p className={`mt-2 text-3xl font-semibold tabular-nums ${counts[t] ? "text-zinc-900" : "text-zinc-300"}`}>{counts[t]}</p>
            <p className="mt-2 text-xs text-zinc-400 group-hover:text-zinc-900">{counts[t] ? "Review →" : "All clear"}</p>
          </Link>
        ))}
      </div>
      {total === 0 && <p className="-mt-4 text-zinc-500">Nothing is waiting for review.</p>}

      <Card
        title="Recent decisions"
        padded={false}
        action={
          <Link href="/admin/activity" className="text-xs text-zinc-500 hover:text-zinc-900">
            View all
          </Link>
        }
      >
        {decisions.length ? (
          <ul className="divide-y divide-zinc-100">
            {decisions.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50/70">
                <span className="w-24 flex-none">
                  <ActionPill action={d.action} />
                </span>
                <Link href={logTargetHref(d.targetType, d.targetId)} className="min-w-0 flex-1 truncate text-zinc-700 hover:text-zinc-900">
                  <span className="font-medium text-zinc-900">{LOG_TARGET_NOUNS[d.targetType].replace(/^./, (c) => c.toUpperCase())}</span>
                  {d.note && <span className="text-zinc-400"> — {d.note}</span>}
                </Link>
                <span className="text-xs whitespace-nowrap text-zinc-400">
                  {d.moderator?.name ?? "deleted user"} · {formatRelative(d.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState title="No decisions yet" description="Approvals and rejections will be listed here." />
          </div>
        )}
      </Card>

      <Card title="Featured blog post">
        <p className="mb-3 max-w-2xl text-zinc-600">
          The home page shows one blog post. Choose it here; while none is chosen, it shows the newest.
        </p>
        {posts.length ? (
          // The key resets the select to the saved choice after saving.
          <form key={posts.find((p) => p.featured)?.id ?? "none"} action={setFeaturedPost} className="flex flex-wrap items-center gap-2">
            <AdminSelect name="id" defaultValue={posts.find((p) => p.featured)?.id ?? ""} aria-label="Featured blog post" className="h-9 max-w-full min-w-0 flex-1 sm:max-w-lg">
              <option value="">None: the newest post</option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({formatDate(p.published)})
                </option>
              ))}
            </AdminSelect>
            <AdminButton type="submit" variant="primary">
              Save
            </AdminButton>
          </form>
        ) : (
          <p className="text-zinc-500">No posts are published yet.</p>
        )}
      </Card>

      {isAdmin(user) && (
        <Card title="Cached data">
          <p className="mb-3 max-w-2xl text-zinc-600">
            The public pages are rendered from cached data, which is kept until something changes through the site. If
            you changed problems or submissions directly in the database, refresh the site so the pages show the new data.
          </p>
          <RefreshCacheButton />
        </Card>
      )}
    </div>
  );
}
