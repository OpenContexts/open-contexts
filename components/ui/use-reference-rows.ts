import { useId, useState } from "react";
import type { Reference } from "@/lib/db/schema";
import { type ReferenceDraft, splitLink, toDrafts } from "@/lib/references";

export type ReferenceRow = ReferenceDraft & { key: string };

const empty: ReferenceDraft = { text: "", url: "" };

/**
 * The state behind a references editor: the listed rows, each editable, and a draft row for the next one.
 * The inputs are submitted as referenceText[] and referenceUrl[] (see toReferences), the draft's included,
 * so a reference typed in but not added is not lost.
 */
export function useReferenceRows(initial: Reference[]) {
  const id = useId();
  const [rows, setRows] = useState<ReferenceRow[]>(() => toDrafts(initial).map((r, i) => ({ ...r, key: `${id}-${i}` })));
  const [draft, setDraft] = useState(empty);
  const canAdd = draft.text.trim() !== "" || draft.url.trim() !== "";

  return {
    rows,
    draft,
    canAdd,
    setDraft: (patch: Partial<ReferenceDraft>) => setDraft((d) => ({ ...d, ...patch })),
    add() {
      if (!canAdd) return;
      setRows((r) => [...r, { ...splitLink(draft), key: crypto.randomUUID() }]);
      setDraft(empty);
    },
    update: (key: string, patch: Partial<ReferenceDraft>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row))),
    /** On leaving the citation: a link pasted into it moves to the link field. */
    tidy: (key: string) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...splitLink(row) } : row))),
    tidyDraft: () => setDraft((d) => splitLink(d)),
    remove: (key: string) => setRows((r) => r.filter((row) => row.key !== key)),
    /** Moves a row one place up (-1) or down (1). */
    move(key: string, by: -1 | 1) {
      setRows((r) => {
        const i = r.findIndex((row) => row.key === key);
        const j = i + by;
        if (i < 0 || j < 0 || j >= r.length) return r;
        const next = [...r];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    },
  };
}
