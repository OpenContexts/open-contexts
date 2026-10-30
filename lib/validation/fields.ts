// Field parsers shared by the submission forms and the admin problem editor.
import { z } from "zod";

export const text = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .min(min, min <= 1 ? `Please enter ${what}.` : `Please write at least ${min} characters.`)
    .max(max, `Please keep this under ${max.toLocaleString("en")} characters.`);

export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .pipe(z.url({ protocol: /^https?$/, error: "Please enter a full link starting with https://" }).optional());

export const slug = z.string().trim().min(1);

/** "a, b ,, c" → ["a", "b", "c"] */
export const commaList = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

/** One reference per line; a URL anywhere in the line becomes its link. */
export const referenceLines = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const url = line.match(/https?:\/\/\S+/)?.[0];
        const rest = url ? line.replace(url, "").replace(/[\s,;.:–-]+$/, "").trim() : line;
        return url ? { text: rest || url, url } : { text: line };
      }),
  );
