import Link from "next/link";
import { MarkdownInline } from "@/components/markdown/markdown";
import type { Post } from "@/lib/data/blog";
import { getCommunityCounts } from "@/lib/data/community";
import { formatDate, formatNames, plural } from "@/lib/format";
import { citesToText } from "@/lib/references";

/**
 * The first paragraph of the text (headings skipped), with display math set inline, so the cut after a few
 * lines does not leave a formula block standing in full.
 */
function excerpt(body: string): string {
  const first = body
    .trim()
    .split(/\n\s*\n/)
    .find((block) => !block.trimStart().startsWith("#"));
  return (first ?? "").replace(/\s*\$\$\s*([\s\S]*?)\s*\$\$\s*/g, (_, math: string) => ` $$${math}$$ `);
}

/** One post in a list: date, authors and comments, the title, then the start of the text. The whole row opens the post. */
function PostRow({ post: p, comments }: { post: Post; comments: number }) {
  return (
    <li className="group relative border-t border-rule px-2 py-4 transition-colors hover:bg-surface max-sm:px-0">
      <p className="text-sm text-ink-subtle">
        {formatDate(p.published)} · {formatNames(p.authors)}
        {comments > 0 && ` · ${plural(comments, "comment")}`}
      </p>
      <Link href={`/blog/${p.slug}`} className="mt-0.5 block text-[1.12rem]/[1.6rem] font-bold text-ink group-hover:text-brand after:absolute after:inset-0">
        {p.title}
      </Link>
      {/* Citations as plain "[n]": the whole entry is a link. */}
      <div className="mt-1 line-clamp-3 text-[0.95rem] text-ink-muted">
        <MarkdownInline source={excerpt(citesToText(p.body, p.references))} />
      </div>
    </li>
  );
}

/** The newest post, larger and with more of its text, above the others on the blog's page. */
function FeaturedPost({ post: p, comments }: { post: Post; comments: number }) {
  return (
    <article className="group relative mb-6 rounded-md border border-rule-strong border-l-4 border-l-gold px-6 py-5 transition-colors hover:bg-surface max-sm:px-4">
      <p className="font-sans text-xs font-bold tracking-[0.12em] text-gold-dark uppercase">Latest post</p>
      <Link href={`/blog/${p.slug}`} className="mt-1.5 block text-[1.45rem]/tight font-bold text-ink group-hover:text-brand after:absolute after:inset-0">
        {p.title}
      </Link>
      <p className="mt-1.5 text-sm text-ink-subtle">
        {formatDate(p.published)} · {formatNames(p.authors)}
        {comments > 0 && ` · ${plural(comments, "comment")}`}
      </p>
      <div className="mt-3 line-clamp-5 text-ink-muted">
        <MarkdownInline source={excerpt(citesToText(p.body, p.references))} />
      </div>
      <p className="mt-3 text-sm font-bold text-brand">Read the post →</p>
    </article>
  );
}

/** Posts, newest first. `featured`: the newest stands out above the rest. */
export async function PostList({ posts, empty = "No posts yet.", featured }: { posts: Post[]; empty?: React.ReactNode; featured?: boolean }) {
  if (!posts.length) return <p className="py-4 text-ink-muted">{empty}</p>;
  const counts = await getCommunityCounts();
  const comments = (p: Post) => counts[p.id]?.comments ?? 0;
  const [first, ...rest] = posts;
  const listed = featured ? rest : posts;
  return (
    <>
      {featured && <FeaturedPost post={first} comments={comments(first)} />}
      {listed.length > 0 && (
        <ul className="border-b border-rule">
          {listed.map((p) => (
            <PostRow key={p.id} post={p} comments={comments(p)} />
          ))}
        </ul>
      )}
    </>
  );
}
