import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Section } from "@/components/explainers/section";
import { MathText } from "@/components/markdown/math-text";
import { StatusBadge, StatusIcon } from "@/components/problems/status";
import { ContributorMap } from "@/components/progress/contributor-map";
import { StatusChart } from "@/components/progress/status-chart";
import { PageTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { PROBLEM_STATUS_LABELS, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";
import { getPublishedProblems } from "@/lib/data/problems";
import { type AssessmentFigures, getAssessmentFigures } from "@/lib/data/assessment";
import { paceFigures, statusTimeline } from "@/lib/data/progress";
import { aoeDate, formatDate, plural } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Progress", description: "How the statuses of the open problems have changed over time." };

/** The status colours of the chart and the tags: red open, gold under revision, green solved. */
const BAR: Record<ProblemStatus, string> = { open: "bg-brand-strong", "under-revision": "bg-gold", solved: "bg-success" };

/** How many status changes the page lists. */
const RECENT = 6;

export default async function ProgressPage() {
  // Cached as a whole, including today's date: it is recomputed daily and whenever a problem changes.
  "use cache";
  cacheLife("days");
  cacheTag("problems");

  const today = aoeDate();
  const problems = await getPublishedProblems();
  const rows = statusTimeline(problems, today);
  const pace = paceFigures(problems, today);
  const figures = await getAssessmentFigures(problems.map((p) => p.id));

  return (
    <>
      <PageTitle>Progress</PageTitle>
      {rows.length === 0 ? (
        <p className="text-center text-ink-muted">No problems have been published yet.</p>
      ) : (
        <>
          <p className="mx-auto max-w-140 text-center text-ink-muted">
            How the list has moved since it went live on {formatDate(rows[0].date)}, drawn from the dated status
            changes in each problem&apos;s history.
          </p>

          <Section title="The list today">
            <StatusSummary problems={problems} />
          </Section>

          <Section title="Over time" intro="Each line steps on the day a status changed. A problem counts from the day it was published.">
            <StatusChart rows={rows} today={today} />
            <p className="text-center text-sm">
              <a href="/progress.json" download="opencontexts-progress.json" className="text-brand hover:underline">
                Download the data (JSON)
              </a>
            </p>
          </Section>

          <Section title="Latest changes of status">
            <RecentChanges problems={problems} today={today} />
          </Section>

          <Section title="Time to resolution">
            <div className="grid gap-3 sm:grid-cols-2">
              <Pace value={pace.toClaim.median} label="days from listing to a first claimed solution" count={pace.toClaim.count} />
              <Pace value={pace.toSolved.median} label="days from a claimed solution to solved" count={pace.toSolved.count} />
            </div>
          </Section>

          <Section title="Where the contributors are" intro="Each researcher who contributed counts in the country of their institution, as their email address gives it.">
            <ContributorMap countries={figures.countries} unplaced={figures.unplaced} />
          </Section>

          <Section title="The first year" intro={<>{SITE.name} is assessed publicly after one year, against targets fixed in advance.</>}>
            <YearBar start={rows[0].date} today={today} />
            <TargetBars figures={figures} className="mt-6" />
            <p className="mt-3 text-center text-sm">
              <Link href="/about#case-study" className="text-brand hover:underline">
                About the case study →
              </Link>
            </p>
          </Section>
        </>
      )}
    </>
  );
}

/** The three statuses as figures with their apples, over a bar split in their proportions. */
function StatusSummary({ problems }: { problems: Problem[] }) {
  const count = (s: ProblemStatus) => problems.filter((p) => p.status === s).length;
  return (
    <div className="mx-auto max-w-170">
      <ul className="grid grid-cols-3 gap-3">
        {PROBLEM_STATUSES.map((s) => (
          <li key={s}>
            <Link href={`/problems?status=${s}`} className="flex flex-col items-center rounded-md border border-rule-strong px-3 py-3 text-ink hover:border-ink hover:bg-surface">
              <span className="flex items-center gap-2">
                <StatusIcon status={s} className="size-6" />
                <strong className="text-[1.8rem] leading-none tabular-nums">{count(s)}</strong>
              </span>
              <span className="mt-1 text-sm tracking-wide text-ink-muted [font-variant:small-caps]">{PROBLEM_STATUS_LABELS[s]}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-rule" role="img" aria-label={PROBLEM_STATUSES.map((s) => `${count(s)} ${PROBLEM_STATUS_LABELS[s]}`).join(", ")}>
        {PROBLEM_STATUSES.map((s) => (
          <span key={s} className={BAR[s]} style={{ width: `${(100 * count(s)) / problems.length}%` }} />
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-ink-subtle">{plural(problems.length, "problem")} on the list</p>
    </div>
  );
}

/** The latest dated changes of status, newest first, each with its problem. */
function RecentChanges({ problems, today }: { problems: Problem[]; today: string }) {
  const changes = problems
    .flatMap((p) => p.history.filter((h) => h.kind === "status" && h.status && h.date <= today).map((h) => ({ problem: p, date: h.date, status: h.status!, text: h.text })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, RECENT);
  if (!changes.length) return <p className="text-center text-ink-muted">No changes of status yet.</p>;
  return (
    <ol className="relative mx-auto max-w-170 border-l border-rule-strong pl-6">
      {changes.map((c, i) => (
        <li key={i} className="relative pb-5 last:pb-0">
          <StatusIcon status={c.status} className="absolute top-0.5 -left-[2.15rem] size-5 rounded-full bg-paper" />
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-subtle">
            <time dateTime={c.date}>{formatDate(c.date)}</time>
            <StatusBadge status={c.status} />
          </p>
          <Link href={`/problems/${c.problem.slug}`} className="mt-0.5 block font-bold text-ink hover:text-brand">
            Problem {c.problem.number}: <MathText text={c.problem.title} />
          </Link>
          {c.text && <p className="text-[0.95rem] text-ink-muted">{c.text}</p>}
        </li>
      ))}
    </ol>
  );
}

/** One median, with how many problems it is taken over. */
function Pace({ value, label, count }: { value: number | null; label: string; count: number }) {
  return (
    <div className="rounded-md border border-rule-strong px-4 py-3 text-center">
      <strong className="block text-[1.8rem] leading-tight tabular-nums">{value ?? "–"}</strong>
      <span className="block text-[0.95rem] text-ink-muted">median {label}</span>
      <span className="block text-sm text-ink-subtle">{count ? `over ${plural(count, "problem")}` : "none yet"}</span>
    </div>
  );
}

/**
 * The targets of the one-year assessment, fixed in advance in the companion paper, each with where it stands: a bar
 * that fills towards the target, and turns green once it is reached.
 */
function TargetBars({ figures: f, className }: { figures: AssessmentFigures; className?: string }) {
  const share = f.problems ? Math.round((100 * f.active) / f.problems) : 0;
  const targets = [
    { value: f.researchers, goal: 50, figure: `${f.researchers}`, target: "≥ 50", label: "researchers contributed" },
    { value: f.institutions, goal: 10, figure: `${f.institutions}`, target: "≥ 10", label: "institutions took part", note: "which we know for sure." },
    { value: share, goal: 50, figure: `${share} %`, target: "≥ 50 %", label: "of the problems got a submission or comment", note: `${f.active} of ${plural(f.problems, "problem")}` },
  ];
  return (
    <ul className={cn("mx-auto grid max-w-170 gap-3 sm:grid-cols-3", className)}>
      {targets.map((t) => {
        const reached = t.value >= t.goal;
        return (
          <li key={t.label} className="flex flex-col rounded-md border border-rule-strong px-4 py-3">
            <p className="flex items-baseline justify-between gap-2">
              <strong className="text-[1.6rem] leading-tight tabular-nums">{t.figure}</strong>
              <span className={cn("font-sans text-xs font-bold whitespace-nowrap", reached ? "text-success" : "text-ink-subtle")}>
                {reached && "✓ "}target {t.target}
              </span>
            </p>
            <span className="text-[0.95rem]/snug text-ink-muted">{t.label}</span>
            <span
              className="mt-auto block pt-3"
              role="img"
              aria-label={`${t.figure} ${t.label}, target ${t.target}${reached ? ", reached" : ""}`}
            >
              <span className="block h-2 overflow-hidden rounded-full bg-rule">
                <span className={cn("block h-full rounded-full", reached ? "bg-success" : "bg-gold")} style={{ width: `${Math.min(100, (100 * t.value) / t.goal)}%` }} />
              </span>
            </span>
            {/* Always there, so the bars line up whether or not a note follows. */}
            <span className="mt-1 min-h-4 text-xs text-ink-subtle">{t.note}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** How far into its first year the list is: a bar from the day it went live to the assessment. */
function YearBar({ start, today }: { start: string; today: string }) {
  const day = Math.max(0, Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000));
  const end = new Date(Date.parse(start) + 365 * 86_400_000).toISOString().slice(0, 10);
  const share = Math.min(1, day / 365);
  return (
    <div className="mx-auto max-w-170">
      <div className="relative h-2.5 rounded-full bg-rule">
        <span className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ width: `${share * 100}%` }} />
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-gold-dark" style={{ left: `${share * 100}%` }} />
      </div>
      <p className="mt-2 flex justify-between text-sm text-ink-subtle">
        <span>Live since {formatDate(start)}</span>
        <strong className="text-ink">{day >= 365 ? "The year is over" : `Day ${day} of 365`}</strong>
        <span>Assessment from {formatDate(end)}</span>
      </p>
    </div>
  );
}
