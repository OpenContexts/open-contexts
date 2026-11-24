import type { ReactNode } from "react";
import { MarkdownContent } from "./markdown";

/** Made-up references for the citation examples. */
const EXAMPLE_REFERENCES = [
  { key: "smith2024", text: "J. Smith, An example paper, J. Examples 1, 1 (2024)", url: "https://arxiv.org/" },
  { key: "lee2025", text: "K. Lee, Another example (2025)" },
];

type Row = { type: string; get: ReactNode };

/** What is typed, and what it looks like: rendered by the site's own renderer, so the two cannot drift apart. */
const rendered = (source: string) => <MarkdownContent source={source} references={EXAMPLE_REFERENCES} className="[&_ol]:mb-0 [&_ul]:mb-0 *:mb-0" />;

const SECTIONS: { title: string; rows: Row[]; cite?: boolean }[] = [
  {
    title: "Text",
    rows: [
      { type: "*italic*", get: rendered("*italic*") },
      { type: "**bold**", get: rendered("**bold**") },
      { type: "`code`", get: rendered("`code`") },
      { type: "[a link](https://arxiv.org)", get: rendered("[a link](https://arxiv.org)") },
    ],
  },
  {
    title: "Structure",
    rows: [
      { type: "## Background", get: "A section heading; on a problem page, sections are lettered A., B., …" },
      { type: "### Special cases", get: "A subsection heading" },
      { type: "> A quotation", get: rendered("> A quotation") },
      { type: "![A description](https://…)", get: "Add an image by a link" },
    ],
  },
  {
    title: "Math (LaTeX)",
    rows: [
      { type: "$\\rho \\otimes \\sigma$", get: rendered("$\\rho \\otimes \\sigma$") },
      { type: "$$\n\\int_0^1 f(x)\\,\\mathrm{d}x\n$$", get: rendered("$$\n\\int_0^1 f(x)\\,\\mathrm{d}x\n$$") },
      { type: "$$E = mc^2 \\tag{1}$$", get: rendered("$$E = mc^2 \\tag{1}$$") },
      { type: "\\$5", get: "A dollar sign that is not math: $5" },
    ],
  },
  {
    title: "Citations",
    cite: true,
    rows: [
      { type: "\\cite{smith2024}", get: rendered("\\cite{smith2024}") },
      { type: "\\cite{smith2024, lee2025}", get: rendered("\\cite{smith2024, lee2025}") },
    ],
  },
];

/**
 * The summary of the formatting: each Markdown and LaTeX feature, as typed and as shown. Used by the (i) panel of
 * the editors (MarkdownHelp) and on the contribute page. `cite`: citations are explained too.
 */
export function FormattingGuide({ cite = true }: { cite?: boolean }) {
  return (
    <>
      <div className="space-y-8">
        {SECTIONS.filter((s) => cite || !s.cite).map((s) => (
          <section key={s.title}>
            <h3 className="mb-1.5 font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">{s.title}</h3>
            <dl className="divide-y divide-rule border-y border-rule">
              {s.rows.map((r) => (
                <div key={r.type} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 py-1">
                  <dt>
                    <code className="font-mono text-[0.8rem] wrap-break-words whitespace-pre-wrap text-ink">{r.type}</code>
                  </dt>
                  <dd className="min-w-0 text-[0.92rem]">{r.get}</dd>
                </div>
              ))}
            </dl>
            {s.cite && (
              <p className="mt-1.5 text-[0.88rem] text-ink-muted">
                Type <code className="font-mono text-[0.8rem]">\cite{"{"}</code> to choose from the problem&apos;s references; the list filters as you
                type. Citations show as numbers, and each number shows its reference on hover.
              </p>
            )}
          </section>
        ))}
      </div>
      <p className="mt-4 text-[0.88rem] text-ink-muted">
        HTML is not supported. All math commands:{" "}
        <a href="https://katex.org/docs/supported.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
          KaTeX&apos;s list of supported functions
        </a>
        .
      </p>
    </>
  );
}
