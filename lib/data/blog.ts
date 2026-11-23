// The published blog posts. Only approved posts leave this module. The list is cached under BLOG_TAG, which
// moderation decisions on posts invalidate; comments on a post are cached like those on a problem (communityTag).
import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import { aoeDate } from "@/lib/format";
import { blogPost, type Reference } from "@/lib/db/schema";
import { withKeys } from "@/lib/references";

export const BLOG_TAG = "blog";

export type Post = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  /** Markdown with math. */
  body: string;
  /** Each with its `key`, so \cite{key} in the text can be resolved. */
  references: (Reference & { key: string })[];
  /** "YYYY-MM-DD", the day the post was first approved. */
  published: string;
  /** Chosen by the moderators for the home page. */
  featured: boolean;
};

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("max");
  cacheTag(BLOG_TAG);
  if (!isDbConfigured()) return [];
  const rows = await db.query.blogPost.findMany({ where: eq(blogPost.status, "approved"), orderBy: desc(blogPost.publishedAt) });
  return rows.flatMap((r) =>
    r.slug && r.publishedAt
      ? [{ id: r.id, slug: r.slug, title: r.title, authors: r.authors, body: r.body, references: withKeys(r.references), published: aoeDate(r.publishedAt), featured: r.featured }]
      : [],
  );
}

/** The post the home page shows: the one the moderators chose, or while they have chosen none, the newest. */
export function featuredPost(posts: Post[]): Post | undefined {
  return posts.find((p) => p.featured) ?? posts[0];
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

export async function getPostById(id: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.id === id);
}
