// Reads for user management. Callers must have checked requireAdmin().
import "server-only";
import { and, count, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { connection } from "next/server";
import type { Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { account, comment, contribution, problemProposal, problemRevision, user } from "@/lib/db/schema";

export const USER_FILTERS = ["all", "staff", "blocked"] as const;
export type UserFilter = (typeof USER_FILTERS)[number];
export const USER_FILTER_LABELS: Record<UserFilter, string> = { all: "All", staff: "Moderators & admins", blocked: "Blocked" };

export const USERS_PER_PAGE = 25;

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  createdAt: Date;
  /** Sign-in methods: "credential" (email and password), "github", "orcid". */
  providers: string[];
  submissions: number;
};

/** `%` and `_` are wildcards in LIKE; a search for "a_b" should match literally. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function filterWhere(filter: UserFilter, query: string): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];
  if (filter === "staff") conditions.push(inArray(user.role, ["moderator", "admin"]));
  if (filter === "blocked") conditions.push(eq(user.banned, true));
  if (query) {
    const pattern = `%${likeEscape(query)}%`;
    conditions.push(or(ilike(user.name, pattern), ilike(user.email, pattern)));
  }
  return and(...conditions);
}

/**
 * The outer row's id, qualified by hand: inside these subqueries Drizzle renders `user.id` as a bare
 * "id", which Postgres would resolve to the subquery table's own id.
 */
const userId = sql`${user}.${sql.identifier(user.id.name)}`;

/** All submissions by one user, across the four submission tables. */
const submissionCount = sql<number>`(
  (select count(*) from ${comment} where ${comment.authorId} = ${userId}) +
  (select count(*) from ${contribution} where ${contribution.authorId} = ${userId}) +
  (select count(*) from ${problemRevision} where ${problemRevision.authorId} = ${userId}) +
  (select count(*) from ${problemProposal} where ${problemProposal.authorId} = ${userId})
)::int`;

const providers = sql<string | null>`(select string_agg(${account.providerId}, ',' order by ${account.providerId}) from ${account} where ${account.userId} = ${userId})`;

export async function listUsers({ filter, query, page }: { filter: UserFilter; query: string; page: number }) {
  await connection();
  const where = filterWhere(filter, query);
  const [rows, [{ total }]] = await db.batch([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: user.banned,
        banReason: user.banReason,
        createdAt: user.createdAt,
        providers,
        submissions: submissionCount,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt), user.id)
      .limit(USERS_PER_PAGE)
      .offset((page - 1) * USERS_PER_PAGE),
    db.select({ total: count() }).from(user).where(where),
  ]);

  const users: UserRow[] = rows.map((r) => ({
    ...r,
    role: (r.role as Role | null) ?? "user",
    banned: !!r.banned,
    providers: r.providers ? r.providers.split(",") : [],
    submissions: Number(r.submissions),
  }));
  return { users, total, pages: Math.max(1, Math.ceil(total / USERS_PER_PAGE)) };
}
