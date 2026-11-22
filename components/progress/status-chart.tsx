// A static step chart of the number of problems per status over time, drawn as SVG on the server.
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import type { TimelineRow } from "@/lib/data/progress";
import { formatDate } from "@/lib/format";

/** In list order; the colours match the rest of the site (red open, gold under revision, green solved). */
const CHART_SERIES: { status: ProblemStatus; color: string }[] = [
  { status: "open", color: "var(--color-brand-strong)" },
  { status: "under-revision", color: "var(--color-gold)" },
  { status: "solved", color: "var(--color-success)" },
];

const W = 980;
const H = 300;
const M = { top: 16, right: 140, bottom: 38, left: 36 };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LABEL_GAP = 16;

const dayOf = (iso: string) => Math.round(Date.parse(iso) / 86_400_000);
const round = (n: number) => Math.round(n * 10) / 10;

/** First days of the months between the two days, thinned so labels never crowd. */
function monthTicks(from: number, to: number) {
  const start = new Date(from * 86_400_000);
  const months: Date[] = [];
  for (let m = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)); m.getTime() / 86_400_000 <= to; m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) {
    months.push(m);
  }
  const every = months.length > 36 ? 12 : months.length > 14 ? 3 : 1;
  let lastYear: number | undefined;
  return months
    .filter((m) => (every === 12 ? m.getUTCMonth() === 0 : m.getUTCMonth() % every === 0))
    .map((m) => {
      const year = m.getUTCFullYear();
      const label = year !== lastYear ? `${MONTHS[m.getUTCMonth()]} ${year}` : MONTHS[m.getUTCMonth()];
      lastYear = year;
      return { day: Math.round(m.getTime() / 86_400_000), label: every === 12 ? String(year) : label };
    });
}

export function StatusChart({ rows, today }: { rows: TimelineRow[]; today: string }) {
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const x0 = dayOf(rows[0].date);
  // At least three months wide, so a young list does not stretch a few days across the whole chart.
  const xEnd = Math.max(dayOf(today), x0 + 90);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const yMax = maxTotal <= 5 ? maxTotal + 1 : Math.ceil((maxTotal + 1) / 5) * 5;
  const yStep = yMax <= 6 ? 1 : yMax <= 12 ? 2 : yMax <= 30 ? 5 : 10;
  const x = (day: number) => round(M.left + ((day - x0) / (xEnd - x0)) * iw);
  const y = (v: number) => round(M.top + ih - (v / yMax) * ih);
  const xToday = x(Math.min(dayOf(today), xEnd));

  const gridValues = Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep);
  const last = rows.at(-1)!;

  // End labels sit beside the last values (`mid` is the label's vertical centre). Labels that would overlap
  // are pushed apart downwards, then back up where that would put them below the axis.
  const labels = CHART_SERIES.map((s) => ({ ...s, value: last[s.status], at: y(last[s.status]), mid: y(last[s.status]) })).sort((a, b) => a.at - b.at);
  for (let i = 1; i < labels.length; i++) labels[i].mid = Math.max(labels[i].mid, labels[i - 1].mid + LABEL_GAP);
  for (let i = labels.length - 1; i >= 0; i--) {
    const limit = i === labels.length - 1 ? M.top + ih - 4 : labels[i + 1].mid - LABEL_GAP;
    labels[i].mid = Math.min(labels[i].mid, limit);
  }

  const path = (status: ProblemStatus) =>
    rows.map((r, i) => (i === 0 ? `M${x(dayOf(r.date))},${y(r[status])}` : `H${x(dayOf(r.date))}V${y(r[status])}`)).join("") + `H${xToday}`;

  return (
    <figure className="my-4">
      <ul className="mb-2 flex justify-center gap-5 font-sans text-sm text-ink-muted">
        {CHART_SERIES.map((s) => (
          <li key={s.status} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.75 w-4 rounded-full" style={{ background: s.color }} />
            {PROBLEM_STATUS_LABELS[s.status]}
          </li>
        ))}
      </ul>
      {/* On a phone the chart keeps a legible size and scrolls sideways, starting from the day the list went live. */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Number of problems by status since ${formatDate(rows[0].date)}. Today: ${CHART_SERIES.map((s) => `${last[s.status]} ${PROBLEM_STATUS_LABELS[s.status]}`).join(", ")}.`}
          className="block h-auto w-full min-w-140 font-sans text-[12.5px] [&_text]:fill-ink-muted"
        >
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} className="stroke-rule" />
              <text x={M.left - 6} y={y(v) + 4} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <line x1={M.left} x2={M.left + iw} y1={M.top + ih} y2={M.top + ih} className="stroke-rule-strong" />
          {monthTicks(x0, xEnd).map((t) => (
            <g key={t.day}>
              <line x1={x(t.day)} x2={x(t.day)} y1={M.top + ih} y2={M.top + ih + 4} className="stroke-rule-strong" />
              <text x={x(t.day)} y={M.top + ih + 19} textAnchor="middle">
                {t.label}
              </text>
            </g>
          ))}
          {/* Open last, so it stays on top where lines run together (most often at zero). */}
          {CHART_SERIES.toReversed().map((s) => (
            <path key={s.status} d={path(s.status)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {labels.map((l) => (
            <g key={l.status}>
              <line x1={xToday + 6} x2={xToday + 14} y1={l.at} y2={l.mid} className="stroke-rule-strong" />
              <circle cx={xToday} cy={l.at} r={4} fill={l.color} stroke="white" strokeWidth={2} />
              <text x={xToday + 18} y={l.mid + 4} className="fill-ink!">
                {l.value} {PROBLEM_STATUS_LABELS[l.status]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
