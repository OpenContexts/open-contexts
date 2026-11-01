import { connection } from "next/server";
import { problemBibtex, siteOrigin, todayIso } from "@/lib/cite";
import { getProblemExport, problemExportToMarkdown } from "@/lib/data/problem-export";

/** The problem with its references, history, contributions and discussion, as one Markdown document (e.g. for an AI agent). */
export async function GET(_request: Request, { params }: RouteContext<"/problems/[slug]/problem.md">) {
  const data = await getProblemExport((await params).slug);
  if (!data) return new Response("Not found", { status: 404 });
  await connection(); // the citation carries today's date as the date of access
  const bibtex = problemBibtex(data.problem, { origin: siteOrigin(), today: todayIso() });
  return new Response(problemExportToMarkdown(data, bibtex), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Inline, so agents and browsers can read it; the page's link downloads it.
      "Content-Disposition": `inline; filename="opencontext-problem-${data.problem.number}.md"`,
    },
  });
}
