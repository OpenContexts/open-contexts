const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The site keeps time Anywhere on Earth (AoE, UTC−12), as conference deadlines do: a day has begun everywhere once
 * it has begun there, and the pages, rendered once for everyone, read the same anywhere. The moment as an ISO string
 * in AoE, "2026-11-22T19:09:00.000" without a zone.
 */
function aoe(value: string | Date): string {
  const t = value instanceof Date ? value.getTime() : Date.parse(value);
  return new Date(t - 12 * 3_600_000).toISOString().slice(0, 23);
}

/** The day of a moment, AoE: "2026-11-22". */
export function aoeDate(value: string | Date = new Date()): string {
  return aoe(value).slice(0, 10);
}

/** "2000-05-24" → "24 May 2000", "1998-09" → "Sep 1998", "1967" → "1967". A Date counts by its day AoE. */
export function formatDate(value: string | Date): string {
  const iso = value instanceof Date ? aoeDate(value) : value;
  const [y, m, d] = iso.split("-");
  if (!m) return y;
  const month = MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}

/** The time of day AoE, "07:05 AoE", from a Date or an ISO timestamp with its zone. */
export function formatTime(value: string | Date): string {
  return `${aoe(value).slice(11, 16)} AoE`;
}

/** "24 May 2000, 07:05 AoE", from a Date or an ISO timestamp with its zone. */
export function formatDateTime(value: string | Date): string {
  return `${formatDate(aoeDate(value))}, ${formatTime(value)}`;
}

/** "Ada", "Ada and Bob", "Ada, Bob and Cy". */
export function formatNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago". Only call it in request-time code (it reads the clock). */
export function formatRelative(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
