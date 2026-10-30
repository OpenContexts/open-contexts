// Renders markdown with GFM and LaTeX math ($…$ inline, $$…$$ display).
// It is safe for user-submitted text: raw HTML is not rendered, unsafe URLs are
// dropped by react-markdown, and KaTeX runs with `trust: false` (no \href, \htmlClass, …).
// MDX is deliberately not used, because MDX evaluates JavaScript.
import Markdown, { type Components, type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/cn";

const remarkPlugins: Options["remarkPlugins"] = [remarkGfm, remarkMath];
const rehypePlugins: Options["rehypePlugins"] = [[rehypeKatex, { trust: false, strict: "ignore", throwOnError: false }]];

function components(untrusted: boolean): Components {
  return {
    a: ({ href, children }) => (
      <a href={href} rel={untrusted ? "nofollow ugc noopener noreferrer" : "noopener"}>
        {children}
      </a>
    ),
  };
}

export function MarkdownContent({
  source,
  className,
  untrusted = false,
}: {
  source: string;
  className?: string;
  /** Set for text written by users: adds rel="nofollow ugc" to links. */
  untrusted?: boolean;
}) {
  return (
    <div className={cn("prose-oc", className)}>
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components(untrusted)}>
        {source}
      </Markdown>
    </div>
  );
}

/** For one-line text (titles, history entries): renders math and emphasis without a wrapping <p>. */
export function MarkdownInline({ source }: { source: string }) {
  return (
    <Markdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={{ ...components(false), p: ({ children }) => <>{children}</> }}
    >
      {source}
    </Markdown>
  );
}
