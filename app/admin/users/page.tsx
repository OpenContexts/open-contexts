import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserActions } from "@/components/admin/user-controls";
import { AdminButton, AdminInput, adminButtonStyles, Card, EmptyState, PageHeader, Pill, RolePill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers, USER_FILTERS, USER_FILTER_LABELS, USERS_PER_PAGE, type UserFilter, type UserRow } from "@/lib/data/users";
import { formatDate, plural } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Users" };

type Params = { filter: UserFilter; query: string; page: number };

function href({ filter, query, page }: Params): string {
  const search = new URLSearchParams();
  if (filter !== "all") search.set("filter", filter);
  if (query) search.set("q", query);
  if (page > 1) search.set("page", String(page));
  const s = search.toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <PageHeader title="Users" description="Everyone with an account. Change what people may do, or block accounts." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-zinc-100" />}>
        <Users searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/admin/users">, "searchParams">) {
  const me = await requireAdmin();
  const raw = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const filter = USER_FILTERS.find((f) => f === one(raw.filter)) ?? "all";
  const query = one(raw.q).trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(one(raw.page))) || 1);
  const { users, total, pages } = await listUsers({ filter, query, page });
  const params: Params = { filter, query, page };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
          {USER_FILTERS.map((f) => (
            <Link
              key={f}
              href={href({ filter: f, query, page: 1 })}
              className={cn("rounded-md px-3 py-1 transition", f === filter ? "bg-white font-medium text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900")}
            >
              {USER_FILTER_LABELS[f]}
            </Link>
          ))}
        </div>
        {/* A plain GET form: the search lives in the URL, so results can be bookmarked and paged. */}
        <form action="/admin/users" role="search" className="flex gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <AdminInput type="search" name="q" defaultValue={query} placeholder="Search name or email" aria-label="Search users" className="w-64" />
          <AdminButton type="submit">Search</AdminButton>
        </form>
      </div>

      {users.length ? (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-100 text-xs text-zinc-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">User</th>
                  <th className="px-3 py-2.5 font-medium">Sign-in</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="px-3 py-2.5 text-right font-medium">Submissions</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="w-12 px-3 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((u) => (
                  <UserTableRow key={u.id} user={u} self={u.id === me.id} />
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 text-zinc-500">
            <span className="tabular-nums">
              {(page - 1) * USERS_PER_PAGE + 1}–{(page - 1) * USERS_PER_PAGE + users.length} of {plural(total, "user")}
            </span>
            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-2">
                <PageLink to={page > 1 ? href({ ...params, page: page - 1 }) : undefined}>← Previous</PageLink>
                <span className="text-xs tabular-nums">
                  Page {page} of {pages}
                </span>
                <PageLink to={page < pages ? href({ ...params, page: page + 1 }) : undefined}>Next →</PageLink>
              </nav>
            )}
          </footer>
        </Card>
      ) : (
        <EmptyState
          title={query ? `No users match “${query}”` : filter === "blocked" ? "No blocked users" : "No users"}
          description={page > 1 && total > 0 ? <Link href={href({ ...params, page: 1 })} className="underline">Back to the first page</Link> : undefined}
        />
      )}
    </>
  );
}

const PROVIDER_LABELS: Record<string, string> = { credential: "Email", github: "GitHub" };

function UserTableRow({ user, self }: { user: UserRow; self: boolean }) {
  return (
    <tr className={cn("align-middle", user.banned && "bg-red-50/40")}>
      <td className="max-w-72 px-5 py-3">
        <p className="flex items-center gap-1.5 font-medium text-zinc-900">
          <span className="truncate">{user.name}</span>
          {self && <Pill>you</Pill>}
          {user.banned && <Pill tone="red">blocked</Pill>}
        </p>
        <p className="truncate text-xs text-zinc-500" title={user.email}>
          {user.email}
          {!user.emailVerified && <span className="text-amber-700"> · not confirmed</span>}
        </p>
        {user.banned && user.banReason && <p className="mt-0.5 truncate text-xs text-red-700" title={user.banReason}>Reason: {user.banReason}</p>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap text-zinc-600">{user.providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ") || "—"}</td>
      <td className="px-3 py-3 whitespace-nowrap text-zinc-600">{formatDate(user.createdAt)}</td>
      <td className="px-3 py-3 text-right text-zinc-600 tabular-nums">{user.submissions}</td>
      <td className="px-3 py-3">
        <RolePill role={user.role} />
      </td>
      <td className="px-3 py-2 text-right">{!self && <UserActions user={user} />}</td>
    </tr>
  );
}

function PageLink({ to, children }: { to?: string; children: React.ReactNode }) {
  const styles = adminButtonStyles({ size: "sm" });
  return to ? (
    <Link href={to} className={styles}>
      {children}
    </Link>
  ) : (
    <span aria-disabled className={cn(styles, "pointer-events-none opacity-40")}>
      {children}
    </span>
  );
}
