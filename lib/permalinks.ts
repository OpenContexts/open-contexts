// Permanent links: short keys that keep pointing at a problem, one of its versions, a contribution or a blog
// post, whatever happens to its URL. They resolve at /contribution/<key>. Plain functions, safe to import anywhere.
//
//   12      Problem 12, its current version (redirects to the problem page)
//   12v3    Problem 12 as it stood at version 3
//   12.3    the third contribution on Problem 12 that got a key
//   blog.7  the seventh blog post

export type PermalinkKey =
  | { type: "problem"; number: number }
  | { type: "version"; number: number; version: number }
  | { type: "contribution"; number: number; seq: number }
  | { type: "post"; seq: number };

export const problemKey = (number: number) => `${number}`;
export const versionKey = (number: number, version: number) => `${number}v${version}`;
export const contributionKey = (number: number, seq: number) => `${number}.${seq}`;
export const postKey = (seq: number) => `blog.${seq}`;

/** The path a key resolves at. */
export const permalinkPath = (key: string) => `/contribution/${key}`;

/** "12v3" → { type: "version", number: 12, version: 3 }. Undefined for anything that is not a key, e.g. "012.3" or "12v0". */
export function parsePermalinkKey(key: string): PermalinkKey | undefined {
  const n = "([1-9]\\d{0,8})";
  let m = new RegExp(`^${n}$`).exec(key);
  if (m) return { type: "problem", number: Number(m[1]) };
  m = new RegExp(`^${n}v${n}$`).exec(key);
  if (m) return { type: "version", number: Number(m[1]), version: Number(m[2]) };
  m = new RegExp(`^${n}\\.${n}$`).exec(key);
  if (m) return { type: "contribution", number: Number(m[1]), seq: Number(m[2]) };
  m = new RegExp(`^blog\\.${n}$`).exec(key);
  if (m) return { type: "post", seq: Number(m[1]) };
  return undefined;
}
