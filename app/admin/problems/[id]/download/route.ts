import { z } from "zod";
import { getCurrentUser, isModerator } from "@/lib/auth/session";
import { problemToMarkdown, readProblem } from "@/lib/data/problems";

/** The problem as a markdown file with YAML frontmatter, for moderators. */
export async function GET(_request: Request, { params }: RouteContext<"/admin/problems/[id]/download">) {
  const notFound = new Response("Not found", { status: 404 });
  if (!isModerator(await getCurrentUser())) return notFound;
  const { id } = await params;
  const problem = z.uuid().safeParse(id).success ? await readProblem(id) : undefined;
  if (!problem) return notFound;
  return new Response(problemToMarkdown(problem), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${problem.slug}.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
