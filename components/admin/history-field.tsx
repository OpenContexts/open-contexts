"use client";

import { type KeyboardEvent, useId, useLayoutEffect, useRef, useState } from "react";
import { AdminButton, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/ui";
import { HISTORY_KINDS, type HistoryKind } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";
import { permalinkPath, versionKey } from "@/lib/permalinks";

const KIND_LABELS: Record<HistoryKind, string> = { posed: "Posed", status: "Status", advance: "Advance", note: "Note", edit: "Edit" };

type Row = HistoryEntry & { key: string };
const empty = { date: "", kind: "advance" as HistoryKind, text: "" };

/** Earliest first; entries with the same date keep their order. */
const byDate = (rows: Row[]) => rows.toSorted((a, b) => a.date.localeCompare(b.date));

/**
 * The three inputs of one entry, side by side: date, kind, text. On small screens the text takes a line of its own,
 * under the date and the kind (and whatever else its row holds). They only edit the entry; what is sent is in
 * the hidden inputs of HistoryField, in the order of the history.
 */
function EntryInputs({
  entry,
  onChange,
  onKeyDown,
  label,
}: {
  entry: Omit<HistoryEntry, "status">;
  onChange: (patch: Partial<HistoryEntry>) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  label: string;
}) {
  // React selects the kind but leaves the options' defaults alone, and after a save it resets the form, which would
  // show the first kind ("Posed") in every row while the state keeps the real one. Making the chosen kind the
  // default keeps it through a reset.
  const kind = useRef<HTMLSelectElement>(null);
  useLayoutEffect(() => {
    for (const option of kind.current?.options ?? []) option.defaultSelected = option.value === entry.kind;
  }, [entry.kind]);
  return (
    <>
      <AdminInput
        value={entry.date}
        onChange={(e) => onChange({ date: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="YYYY-MM-DD"
        aria-label={`${label}: date`}
        className="w-32 flex-none tabular-nums max-sm:w-[7.25rem]"
      />
      <AdminSelect
        ref={kind}
        value={entry.kind}
        onChange={(e) => onChange({ kind: e.target.value as HistoryKind })}
        aria-label={`${label}: kind`}
        className="h-9 w-32 flex-none max-sm:w-auto max-sm:min-w-0 max-sm:flex-1 max-sm:pr-7"
      >
        {HISTORY_KINDS.map((k) => (
          <option key={k} value={k}>
            {KIND_LABELS[k]}
          </option>
        ))}
      </AdminSelect>
      {/* Grows with the text, so a long entry can be read in full; it stays one line of text. */}
      <AdminTextarea
        rows={1}
        value={entry.text}
        onChange={(e) => onChange({ text: e.target.value.replace(/\s*\n\s*/g, " ") })}
        onKeyDown={onKeyDown ?? ((e) => e.key === "Enter" && e.preventDefault())}
        placeholder="What happened"
        aria-label={`${label}: text`}
        className="min-h-9 min-w-0 flex-1 resize-none py-2 leading-5 field-sizing-content max-sm:order-last max-sm:basis-full"
      />
    </>
  );
}

/**
 * What an entry links to, set when the change was saved or the contribution accepted: the version of the text an
 * edit started ("v3") or the accepted contribution ("12.3"), opening in a new tab, with a button that takes the
 * link off. The entry stays; the site then shows it without the line of who made the change.
 */
function EntryLink({ entry, number, onUnlink }: { entry: HistoryEntry; number?: number; onUnlink: () => void }) {
  const key = entry.contribution ?? (entry.version && number ? versionKey(number, entry.version) : undefined);
  if (!key) return null;
  const label = entry.contribution ? `Contribution ${key}` : `Version ${entry.version}`;
  return (
    // On small screens under the entry's text (see HistoryField).
    <span className="inline-flex h-9 flex-none items-center rounded-md bg-zinc-100 text-xs ring-1 ring-zinc-200 ring-inset max-sm:order-last">
      <a href={permalinkPath(key)} target="_blank" rel="noopener" title={`Open ${label.toLowerCase()} in a new tab`} className="px-2 font-medium text-zinc-700 tabular-nums hover:text-zinc-950 hover:underline">
        ↗ {entry.contribution ? key : `v${entry.version}`}
      </a>
      <button
        type="button"
        onClick={onUnlink}
        aria-label={`Remove the link to ${label.toLowerCase()}`}
        title="Remove the link; the entry stays"
        className="h-full cursor-pointer rounded-r-md border-l border-zinc-200 px-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
      >
        ×
      </button>
    </span>
  );
}

/**
 * "Progress and history" as a list of entries, newest first as on the site, under the row that adds one (button or
 * Enter). Each entry stays editable. They are sent oldest first, as they are stored, as parallel arrays
 * (historyDate[], …): the order of entries with the same date is the order the site shows them in.
 */
export function HistoryField({ initial, number, error }: { initial: HistoryEntry[]; /** The problem's, for the links to its versions; none for a new problem. */ number?: number; error?: string }) {
  const id = useId();
  // In date order, as the site shows them (entries with the same date keep theirs); a changed date moves its
  // entry only when the next one is added, so rows don't jump while typing.
  const [rows, setRows] = useState<Row[]>(() => byDate(initial.map((h, i) => ({ ...h, key: `${id}-${i}` }))));
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
      {rows.map((row) => (
        <span key={row.key} hidden>
          <input type="hidden" name="historyDate[]" value={row.date} />
          <input type="hidden" name="historyKind[]" value={row.kind} />
          <input type="hidden" name="historyText[]" value={row.text} />
          <input type="hidden" name="historyStatus[]" value={row.status ?? ""} />
          <input type="hidden" name="historyVersion[]" value={row.version ?? ""} />
          <input type="hidden" name="historyContribution[]" value={row.contribution ?? ""} />
          <input type="hidden" name="historyAt[]" value={row.at ?? ""} />
        </span>
      ))}
      <div className="mb-3 flex flex-wrap items-start gap-2 rounded-md bg-zinc-50 p-2 ring-1 ring-zinc-200 ring-inset">
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
        <AdminButton onClick={add} disabled={!canAdd} className="flex-none max-sm:order-last max-sm:ml-auto">
          Add
        </AdminButton>
      </div>
      {rows.length > 0 ? (
        <ol reversed className="space-y-2 max-sm:space-y-2.5">
          {rows.map((row, i) => ({ row, i })).toReversed().map(({ row, i }) => (
            // On small screens each entry is a framed block: date, kind and × above the text, and its link below.
            <li key={row.key} className="flex items-start gap-2 max-sm:flex-wrap max-sm:rounded-md max-sm:p-2 max-sm:ring-1 max-sm:ring-zinc-200 max-sm:ring-inset">
              <EntryInputs entry={row} onChange={(patch) => update(row.key, patch)} label={`Entry ${i + 1}`} />
              <EntryLink entry={row} number={number} onUnlink={() => update(row.key, { version: undefined, contribution: undefined })} />
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                aria-label={`Remove entry ${i + 1}`}
                className="mt-0.5 inline-flex size-8 flex-none max-sm:ml-auto cursor-pointer items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-zinc-500">No entries yet.</p>
      )}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">Dates can be a year (2019), a month (2019-07) or a day (2019-07-04). Newest first, as on the site.</p>
      )}
    </div>
  );
}
