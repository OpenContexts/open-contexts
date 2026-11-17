"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { AdminButton, AdminInput, AdminSelect } from "@/components/admin/ui";
import { HISTORY_KINDS, type HistoryKind } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";

const KIND_LABELS: Record<HistoryKind, string> = { posed: "Posed", status: "Status", advance: "Advance", note: "Note", edit: "Edit" };

type Row = HistoryEntry & { key: string };
const empty = { date: "", kind: "advance" as HistoryKind, text: "" };

/** Earliest first; entries with the same date keep their order. */
const byDate = (rows: Row[]) => rows.toSorted((a, b) => a.date.localeCompare(b.date));

/** The three inputs of one entry, side by side: date, kind, text. */
function EntryInputs({
  entry,
  onChange,
  names,
  onKeyDown,
  label,
}: {
  entry: Omit<HistoryEntry, "status">;
  onChange: (patch: Partial<HistoryEntry>) => void;
  /** Set for saved entries, so they are submitted; the "new entry" inputs are not. */
  names?: boolean;
  onKeyDown?: (e: KeyboardEvent) => void;
  label: string;
}) {
  return (
    <>
      <AdminInput
        name={names ? "historyDate[]" : undefined}
        value={entry.date}
        onChange={(e) => onChange({ date: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="YYYY-MM-DD"
        aria-label={`${label}: date`}
        className="w-32 flex-none tabular-nums"
      />
      <AdminSelect
        name={names ? "historyKind[]" : undefined}
        value={entry.kind}
        onChange={(e) => onChange({ kind: e.target.value as HistoryKind })}
        aria-label={`${label}: kind`}
        className="h-9 w-32 flex-none"
      >
        {HISTORY_KINDS.map((k) => (
          <option key={k} value={k}>
            {KIND_LABELS[k]}
          </option>
        ))}
      </AdminSelect>
      <AdminInput
        name={names ? "historyText[]" : undefined}
        value={entry.text}
        onChange={(e) => onChange({ text: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="What happened"
        aria-label={`${label}: text`}
        className="min-w-0 flex-1"
      />
    </>
  );
}

/**
 * "Progress and history" as a list of entries. Each saved entry stays editable; the row at the bottom
 * adds a new one (button or Enter). Entries are submitted as parallel arrays (historyDate[], …).
 */
export function HistoryField({ initial, error }: { initial: HistoryEntry[]; error?: string }) {
  const id = useId();
  const [rows, setRows] = useState<Row[]>(() => initial.map((h, i) => ({ ...h, key: `${id}-${i}` })));
  const [draft, setDraft] = useState(empty);
  const canAdd = draft.date.trim() !== "" && draft.text.trim() !== "";

  function add() {
    if (!canAdd) return;
    setRows((r) => byDate([...r, { ...draft, date: draft.date.trim(), text: draft.text.trim(), key: crypto.randomUUID() }]));
    setDraft(empty);
  }
  const update = (key: string, patch: Partial<HistoryEntry>) => setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div>
      {rows.length > 0 ? (
        <ol className="mb-3 space-y-2">
          {rows.map((row, i) => (
            <li key={row.key} className="flex items-center gap-2">
              <EntryInputs entry={row} onChange={(patch) => update(row.key, patch)} names label={`Entry ${i + 1}`} />
              <input type="hidden" name="historyStatus[]" value={row.status ?? ""} />
              <input type="hidden" name="historyVersion[]" value={row.version ?? ""} />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                aria-label={`Remove entry ${i + 1}`}
                className="inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-3 text-zinc-500">No entries yet.</p>
      )}
      <div className="flex items-center gap-2 rounded-md bg-zinc-50 p-2 ring-1 ring-zinc-200 ring-inset">
        <EntryInputs
          entry={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          // Enter adds the entry instead of submitting the whole form.
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          label="New entry"
        />
        <AdminButton onClick={add} disabled={!canAdd} className="flex-none">
          Add
        </AdminButton>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">Dates can be a year (2019), a month (2019-07) or a day (2019-07-04). The site lists the newest first.</p>
      )}
    </div>
  );
}
