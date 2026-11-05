import { useId, useState } from "react";
import type { Reference } from "@/lib/db/schema";
import { citeKey, type ReferenceDraft, splitLink, toDrafts } from "@/lib/references";

/** A listed reference; `rowId` identifies the row, `key` is what the text cites it by (\cite{key}). */
export type ReferenceRow = ReferenceDraft & { rowId: string; key: string };

const empty: ReferenceDraft = { text: "", url: "" };

/**
 * The state behind a references editor: the listed rows, each editable, and a draft row for the next one.
 * The inputs are submitted as referenceText[], referenceUrl[] and referenceKey[] (see toReferences), the draft's
 * included, so a reference typed in but not added is not lost. A row gets its key when it is added, made from its
 * citation, and keeps it when the citation is edited, so the text's citations stay valid.
 */
export function useReferenceRows(initial: Reference[]) {
  const id = useId();
  const [rows, setRows] = useState<ReferenceRow[]>(() => {
    const taken: string[] = [];
    return toDrafts(initial).map((r, i) => {
      const key = r.key || citeKey(r.text, taken);
      taken.push(key);
      return { ...r, key, rowId: `${id}-${i}` };
    });
  });
  const [draft, setDraft] = useState(empty);
  const canAdd = draft.text.trim() !== "" || draft.url.trim() !== "";

  return {
    rows,
    draft,
    canAdd,
    setDraft: (patch: Partial<ReferenceDraft>) => setDraft((d) => ({ ...d, ...patch })),
    add() {
      if (!canAdd) return;
      const added = splitLink(draft);
      setRows((r) => [...r, { ...added, key: citeKey(added.text, r.map((row) => row.key)), rowId: crypto.randomUUID() }]);
      setDraft(empty);
    },
    update: (rowId: string, patch: Partial<ReferenceDraft>) => setRows((r) => r.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))),
    /** On leaving the citation: a link pasted into it moves to the link field. */
    tidy: (rowId: string) => setRows((r) => r.map((row) => (row.rowId === rowId ? { ...row, ...splitLink(row) } : row))),
    tidyDraft: () => setDraft((d) => splitLink(d)),
    remove: (rowId: string) => setRows((r) => r.filter((row) => row.rowId !== rowId)),
    /** Moves a row one place up (-1) or down (1). */
    move(rowId: string, by: -1 | 1) {
      setRows((r) => {
        const i = r.findIndex((row) => row.rowId === rowId);
        const j = i + by;
        if (i < 0 || j < 0 || j >= r.length) return r;
        const next = [...r];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      });
    },
  };
}

export type ReferenceRows = ReturnType<typeof useReferenceRows>;
