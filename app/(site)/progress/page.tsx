import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { StatusChart } from "@/components/progress/status-chart";
import { PageTitle, SectionTitle } from "@/components/ui";
import { getProblems } from "@/lib/data/problems";
import { paceFigures, statusTimeline } from "@/lib/data/progress";
import { formatDate, plural } from "@/lib/format";

export const metadata: Metadata = { title: "Progress", description: "How the statuses of the open problems have changed over time." };

export default async function ProgressPage() {
  // Cached as a whole, including today's date: it is recomputed daily and whenever a problem changes.
  "use cache";
  cacheLife("days");
  cacheTag("problems");

  const today = new Date().toISOString().slice(0, 10);
  const problems = await getProblems();
  const rows = statusTimeline(problems, today);
  const pace = paceFigures(problems, today);

  return (
    <>
      <PageTitle>Progress</PageTitle>
      {rows.length === 0 ? (
        <p className="text-center text-ink-muted">No problems have been published yet.</p>
      ) : (
        <>
          <p className="text-justify hyphens-auto max-sm:text-left">
            How the list has moved since it went live on {formatDate(rows[0].date)}: how many problems are listed, and
            how many of them are open, under revision or solved. Every change of status is a dated entry in a
            problem&apos;s history, and the chart is drawn from those dates. A problem counts from the day it was
            published, with the status it had then.
          </p>

          <SectionTitle>I. Problems by status over time</SectionTitle>
          <StatusChart rows={rows} today={today} />
          <p className="text-center text-sm text-ink-subtle">
            Each line steps on the day a status changed.{" "}
            <Link href="/problems" className="text-brand hover:underline">
              See all problems
            </Link>
          </p>

          <SectionTitle>II. Time to resolution</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Figure
              value={pace.toClaim.median}
              label={pace.toClaim.count ? `median days from listing to a first claimed solution (${plural(pace.toClaim.count, "problem")})` : "days from listing to a first claimed solution (none yet)"}
            />
            <Figure
              value={pace.toSolved.median}
              label={pace.toSolved.count ? `median days from a claimed solution to solved (${plural(pace.toSolved.count, "problem")})` : "days from a claimed solution to solved (none yet)"}
            />
          </div>
        </>
      )}
    </>
  );
}

function Figure({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex items-baseline gap-3 rounded border border-rule-strong px-4 py-3">
      <strong className="text-[1.7rem] leading-none tabular-nums">{value ?? "–"}</strong>
      <span className="text-[0.95rem] text-ink-muted">{label}</span>
    </div>
  );
}
