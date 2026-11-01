import { cacheLife, cacheTag } from "next/cache";
import { siteOrigin } from "@/lib/cite";
import { PROBLEM_STATUSES } from "@/lib/constants";
import { getProblems, statusSince } from "@/lib/data/problems";
import { paceFigures, statusTimeline } from "@/lib/data/progress";
import { SITE } from "@/lib/site";

/** The data behind the progress page, as JSON. */
export async function GET() {
  return new Response(JSON.stringify(await progressData(), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `inline; filename="opencontext-progress.json"`,
    },
  });
}

/** Cached like the progress page: recomputed daily and whenever a problem changes. */
async function progressData() {
  "use cache";
  cacheLife("days");
  cacheTag("problems");

  const today = new Date().toISOString().slice(0, 10);
  const problems = await getProblems();
  const origin = siteOrigin();
  const timeline = statusTimeline(problems, today);
  const pace = paceFigures(problems, today);

  return {
    source: { name: SITE.name, title: `${SITE.name}: ${SITE.subtitle}`, url: `${origin}/progress` },
    generated: today,
    listedSince: timeline[0]?.date ?? null,
    current: {
      total: problems.length,
      ...Object.fromEntries(PROBLEM_STATUSES.map((s) => [s, problems.filter((p) => p.status === s).length])),
    },
    /** The counts at the end of every day on which something changed. */
    timeline,
    timeToResolution: {
      listingToFirstClaim: { medianDays: pace.toClaim.median, problems: pace.toClaim.count },
      claimToSolved: { medianDays: pace.toSolved.median, problems: pace.toSolved.count },
    },
    problems: problems.map((p) => ({
      number: p.number,
      title: p.title,
      url: `${origin}/problems/${p.slug}`,
      status: p.status,
      statusSince: statusSince(p),
      listed: p.listed,
      areas: p.areas,
      statusChanges: p.history
        .filter((h) => h.kind === "status")
        .toSorted((a, b) => a.date.localeCompare(b.date))
        .map((h) => ({ date: h.date, status: h.status ?? null, text: h.text })),
    })),
  };
}
