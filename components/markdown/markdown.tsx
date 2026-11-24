// Renders markdown with GFM and LaTeX math ($…$ inline, $$…$$ display), and citations: \cite{key} becomes
// "[n]", the reference's number, with the reference shown on hover (see Citation).
// It is safe for user-submitted text: raw HTML is not rendered, unsafe URLs are
// dropped by react-markdown, and KaTeX runs with `trust: false` (no \href, \htmlClass, …).
// MDX is deliberately not used, because MDX evaluates JavaScript.
import Markdown, { type Components, type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/cn";
import { type Citable, citables, splitCites } from "@/lib/references";
import { Citation } from "./citation";

/**
 * $$…$$ is display math, as in LaTeX, also on one line or within a paragraph, where remark-math reads it as
 * inline math. Display math can number its equations with \tag{…}, which KaTeX refuses inline.
 */
function remarkDisplayDollars() {
  const walk = (node: MdNode, source: string) => {
    for (const child of node.children ?? []) {
      const start = child.position?.start.offset;
      if (child.type === "inlineMath" && start !== undefined && source.startsWith("$$", start)) {
        child.data = { ...child.data, hProperties: { className: ["language-math", "math-display"] } };
      } else walk(child, source);
    }
  };
  return (tree: MdNode, file: { value: unknown }) => walk(tree, String(file.value));
}

const remarkPlugins: Options["remarkPlugins"] = [remarkGfm, remarkMath, remarkDisplayDollars];
const rehypePlugins: Options["rehypePlugins"] = [[rehypeKatex, { trust: false, strict: "ignore", throwOnError: false }]];

/** What a text can cite: the references of its problem (or proposal), with or without their keys. */
export type CitableReferences = { text: string; url?: string; key?: string }[];

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown>; position?: { start: { offset?: number } } };

/**
 * Turns each \cite{a, b} in the text into a <cite> element carrying its keys, which `components.cite` renders.
 * Code and math are separate nodes, so a \cite inside them is left alone. Raw HTML is not rendered, so every
 * <cite> comes from here.
 */
function remarkCite() {
  const walk = (node: MdNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child): MdNode[] => {
      if (child.type !== "text" || !child.value?.includes("\\cite{")) {
        walk(child);
        return [child];
      }
      return splitCites(child.value).map((part) =>
        typeof part === "string"
          ? { type: "text", value: part }
          : { type: "citation", data: { hName: "cite", hProperties: { dataKeys: part.keys.join(",") }, hChildren: [] } },
      );
    });
  };
  return (tree: MdNode) => walk(tree);
}

function components(untrusted: boolean, cites?: Map<string, Citable>): Components {
  return {
    a: ({ href, children }) => (
      <a href={href} rel={untrusted ? "nofollow ugc noopener noreferrer" : "noopener"}>
        {children}
      </a>
    ),
    // Uploaded through the editors (lib/images.ts) or linked from elsewhere. Their sizes are not known, which
    // next/image needs. Loaded as they scroll into view, and without telling another site which page shows them.
    img: ({ src, alt }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
    ),
    ...(cites && {
      cite: ({ node }) => {
        const keys = String(node?.properties?.dataKeys ?? "").split(",").filter(Boolean);
        return <Citation items={keys.map((key) => cites.get(key) ?? { key, missing: true as const })} />;
      },
    }),
  };
}

/** The plugins and components for a text; citations are only resolved when its references are given. */
function setup(untrusted: boolean, references?: CitableReferences) {
  const cites = references && new Map(citables(references).map((c) => [c.key, c]));
  return { remarkPlugins: cites ? [...remarkPlugins!, remarkCite] : remarkPlugins, components: components(untrusted, cites) };
}

export function MarkdownContent({
  source,
  className,
  untrusted = false,
  references,
}: {
  source: string;
  className?: string;
  /** Set for text written by users: adds rel="nofollow ugc" to links. */
  untrusted?: boolean;
  /** The references that \cite{key} refers to. Without them, a \cite stays as written. */
  references?: CitableReferences;
}) {
  const { remarkPlugins, components } = setup(untrusted, references);
  return (
    <div className={cn("prose-oc", className)}>
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {source}
      </Markdown>
    </div>
  );
}

/**
 * For one-line text (titles, history entries, the first lines in lists): renders math and emphasis without a
 * wrapping <p>. Images are left out: they have no place in a line.
 */
export function MarkdownInline({ source, references }: { source: string; references?: CitableReferences }) {
  const { remarkPlugins, components } = setup(false, references);
  return (
    <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={{ ...components, p: ({ children }) => <>{children}</>, img: () => null }}>
      {source}
    </Markdown>
  );
}
