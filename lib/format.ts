const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2000-05-24" → "24 May 2000", "1998-09" → "Sep 1998", "1967" → "1967". Also accepts a Date. */
export function formatDate(value: string | Date): string {
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  const [y, m, d] = iso.split("-");
  if (!m) return y;
  const month = MONTHS[Number(m) - 1];
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
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
