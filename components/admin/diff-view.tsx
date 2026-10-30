import { diffWordsWithSpace } from "diff";

/** Word-level diff of two texts: removals struck through in red, additions in green. */
export function TextDiff({ before, after }: { before: string; after: string }) {
  if (before === after) return <p className="text-zinc-400 italic">No changes.</p>;
  return (
    <pre className="font-ui text-[13px]/relaxed whitespace-pre-wrap break-words text-zinc-800">
      {diffWordsWithSpace(before, after).map((part, i) =>
        part.added ? (
          <ins key={i} className="rounded-sm bg-emerald-100 text-emerald-900 no-underline">
            {part.value}
          </ins>
        ) : part.removed ? (
          <del key={i} className="rounded-sm bg-red-100 text-red-800 decoration-red-400">
            {part.value}
          </del>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </pre>
  );
}
