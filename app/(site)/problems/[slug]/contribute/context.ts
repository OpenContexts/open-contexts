import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getProblem } from "@/lib/data/problems";

/** For the form pages: the problem (or 404) and the signed-in user (or a redirect to sign-in). */
export async function loadContributionContext(params: Promise<{ slug: string }>, form: string) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();
  const user = await requireUser(`/problems/${slug}/contribute/${form}`);
  return { problem, user, back: { href: `/problems/${slug}`, label: `Problem ${problem.number}: ${problem.title}` } };
}
