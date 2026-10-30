import type { Metadata } from "next";
import Link from "next/link";
import { UserActions } from "@/components/admin/user-controls";
import { AdminButton, AdminInput, adminButtonStyles, Avatar, Card, EmptyState, PageHeader, Pill, RolePill, Segmented, Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui";
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
      <Users searchParams={searchParams} />
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
        <Segmented label="Filter users" items={USER_FILTERS.map((f) => ({ href: href({ filter: f, query, page: 1 }), active: f === filter, label: USER_FILTER_LABELS[f] }))} />
        {/* A plain GET form: the search lives in the URL, so results can be bookmarked and paged. */}
        <form action="/admin/users" role="search" className="flex gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <AdminInput type="search" name="q" defaultValue={query} placeholder="Search name or email" aria-label="Search users" className="w-64" />
          <AdminButton type="submit">Search</AdminButton>
        </form>
      </div>

      {users.length ? (
        <Card padded={false}>
          <Table>
            <THead>
              <tr>
                <Th>User</Th>
                <Th>Sign-in</Th>
                <Th>Joined</Th>
                <Th className="text-right">Submissions</Th>
                <Th>Role</Th>
                <Th className="w-12">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <UserTableRow key={u.id} user={u} self={u.id === me.id} />
              ))}
            </TBody>
          </Table>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
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
    <Tr className={cn(user.banned && "bg-red-50/50 hover:bg-red-50/70")}>
      <Td className="max-w-80">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0 leading-tight">
            <p className="flex items-center gap-1.5 font-medium text-zinc-900">
              <span className="truncate">{user.name}</span>
              {self && <Pill>You</Pill>}
              {user.banned && (
                <Pill tone="red" dot>
                  Blocked
                </Pill>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500" title={user.email}>
              {user.email}
              {!user.emailVerified && <span className="text-amber-700"> · not confirmed</span>}
            </p>
            {user.banned && user.banReason && (
              <p className="mt-0.5 truncate text-xs text-red-700" title={user.banReason}>
                Reason: {user.banReason}
              </p>
            )}
          </div>
        </div>
      </Td>
      <Td className="whitespace-nowrap text-zinc-600">{user.providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ") || "—"}</Td>
      <Td className="whitespace-nowrap text-zinc-600">{formatDate(user.createdAt)}</Td>
      <Td className="text-right text-zinc-600 tabular-nums">{user.submissions}</Td>
      <Td>
        <RolePill role={user.role} />
      </Td>
      <Td className="py-2 text-right">{!self && <UserActions user={user} />}</Td>
    </Tr>
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
