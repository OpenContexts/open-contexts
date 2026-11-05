"use client";

import type { KeyboardEvent } from "react";
import { AdminButton, AdminInput, AdminTextarea } from "@/components/admin/ui";
import type { ReferenceRows } from "@/components/ui/use-reference-rows";
import { cn } from "@/lib/cn";
import { oneLine, type ReferenceDraft } from "@/lib/references";

const iconButton =
  "inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:invisible";

/** The two inputs of one reference, side by side: citation and link. */
function ReferenceInputs({
  reference,
  onChange,
  onBlur,
  onKeyDown,
  label,
}: {
  reference: ReferenceDraft;
  onChange: (patch: Partial<ReferenceDraft>) => void;
  onBlur: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  label: string;
}) {
  return (
    <>
      {/* Grows with the citation, so a long one can be read in full. */}
      <AdminTextarea
        name="referenceText[]"
        rows={1}
        value={reference.text}
        onChange={(e) => onChange({ text: oneLine(e.target.value) })}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Authors, title, journal (year)"
        aria-label={`${label}: citation`}
        className="min-h-9 min-w-0 flex-1 resize-none py-2 leading-5 field-sizing-content"
      />
      <AdminInput
        name="referenceUrl[]"
        type="url"
        value={reference.url}
        onChange={(e) => onChange({ url: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="https://… (optional)"
        aria-label={`${label}: link`}
        className="w-44 flex-none max-md:w-36"
      />
      <input type="hidden" name="referenceKey[]" value={reference.key ?? ""} />
    </>
  );
}

/**
 * The references as a numbered list, in the order shown on the site. Each stays editable and can be moved;
 * the row at the bottom adds a new one (button or Enter). Each shows the key the text cites it by. `refs` from useReferenceRows.
 */
export function ReferencesField({ refs, error }: { refs: ReferenceRows; error?: string }) {
  // Enter adds the reference instead of submitting the whole form.
  const addOnEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      refs.add();
    }
  };

  return (
    <div>
      {refs.rows.length > 0 ? (
        <ol className="mb-3 space-y-2">
          {refs.rows.map((row, i) => (
            <li key={row.rowId} className="flex items-start gap-2">
              <span className="w-6 flex-none pt-2.5 text-right text-xs text-zinc-400 tabular-nums">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <ReferenceInputs
                    reference={row}
                    onChange={(patch) => refs.update(row.rowId, patch)}
                    onBlur={() => refs.tidy(row.rowId)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    label={`Reference ${i + 1}`}
                  />
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-400">\cite{`{${row.key}}`}</p>
              </div>
              <div className="flex flex-none pt-0.5">
                <button type="button" onClick={() => refs.move(row.rowId, -1)} disabled={i === 0} aria-label={`Move reference ${i + 1} up`} className={iconButton}>
                  ↑
                </button>
                <button type="button" onClick={() => refs.move(row.rowId, 1)} disabled={i === refs.rows.length - 1} aria-label={`Move reference ${i + 1} down`} className={iconButton}>
                  ↓
                </button>
                <button type="button" onClick={() => refs.remove(row.rowId)} aria-label={`Remove reference ${i + 1}`} className={cn(iconButton, "hover:bg-red-50 hover:text-red-600")}>
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-3 text-zinc-500">No references yet.</p>
      )}
      <div className="flex items-start gap-2 rounded-md bg-zinc-50 p-2 ring-1 ring-zinc-200 ring-inset">
        <ReferenceInputs reference={refs.draft} onChange={refs.setDraft} onBlur={refs.tidyDraft} onKeyDown={addOnEnter} label="New reference" />
        <AdminButton onClick={refs.add} disabled={!refs.canAdd} aria-label="Add reference" className="flex-none">
          Add
        </AdminButton>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-zinc-500">The link is optional. A link pasted into the citation is moved to the link field. Cite a reference in the texts by typing \cite{"{"}.</p>
      )}
    </div>
  );
}
