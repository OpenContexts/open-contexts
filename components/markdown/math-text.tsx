// One line of plain text with LaTeX math in it, for titles: $…$ (and $$…$$, also inline) is rendered with KaTeX,
// everything else stays as written, with no markdown. \$ is a dollar sign. Safe for user-submitted text: the text
// is escaped by React, and KaTeX runs with `trust: false`, as in MarkdownContent.
import katex from "katex";

/** Splits `text` into its plain parts and its math, in order. */
function parts(text: string): ({ text: string } | { tex: string })[] {
  const out: ({ text: string } | { tex: string })[] = [];
  let plain = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\\" && text[i + 1] === "$") {
      plain += "$";
      i += 2;
      continue;
    }
    if (text[i] === "$") {
      const fence = text.startsWith("$$", i) ? "$$" : "$";
      const end = closing(text, i + fence.length, fence);
      if (end > i + fence.length) {
        if (plain) out.push({ text: plain });
        plain = "";
        out.push({ tex: text.slice(i + fence.length, end) });
        i = end + fence.length;
        continue;
      }
    }
    plain += text[i++];
  }
  if (plain) out.push({ text: plain });
  return out;
}

/** Where the math opened before `from` ends: the next `fence` not escaped with a backslash, or -1. */
function closing(text: string, from: number, fence: string): number {
  for (let j = from; j < text.length; j++) {
    if (text[j] === "\\") j++;
    else if (text.startsWith(fence, j)) return j;
  }
  return -1;
}

export function MathText({ text }: { text: string }) {
  return parts(text).map((p, i) =>
    "tex" in p ? (
      <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(p.tex, { throwOnError: false, trust: false, strict: "ignore" }) }} />
    ) : (
      p.text
    ),
  );
}

/** The text with the math left as its LaTeX, without the dollar signs: for places that can't render it, like the page's title. */
export function mathAsPlainText(text: string): string {
  return parts(text)
    .map((p) => ("tex" in p ? p.tex : p.text))
    .join("");
}
