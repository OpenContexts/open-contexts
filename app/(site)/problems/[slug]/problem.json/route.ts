import { connection } from "next/server";
import { problemBibtex, siteOrigin, todayIso } from "@/lib/cite";
import { getProblemExport } from "@/lib/data/problem-export";

/** The problem with its references, history, contributions and discussion, as JSON (see ProblemExport). */
export async function GET(_request: Request, { params }: RouteContext<"/problems/[slug]/problem.json">) {
  const data = await getProblemExport((await params).slug);
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  await connection(); // the citation carries today's date as the date of access
  const citation = { bibtex: problemBibtex(data.problem, { origin: siteOrigin(), today: todayIso() }) };
  return new Response(JSON.stringify({ ...data, citation }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `inline; filename="opencontexts-problem-${data.problem.number}.json"`,
    },
  });
}
