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

export async function PostList({ posts, empty = "No posts yet." }: { posts: Post[]; empty?: React.ReactNode }) {
  if (!posts.length) return <p className="py-4 text-ink-muted">{empty}</p>;
  const counts = await getCommunityCounts();
  return (
    <ul className="border-b border-rule">
      {posts.map((p) => (
        <PostRow key={p.id} post={p} comments={counts[p.id]?.comments ?? 0} />
      ))}
    </ul>
  );
}
